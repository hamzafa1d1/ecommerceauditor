/**
 * Maps raw Meta Marketing API responses into the typed Campaign / Ad / DailyInsight
 * shapes the dashboard components expect.
 *
 * All numbers from Meta arrive as strings — we coerce them via n().
 * Purchase conversions are detected across the common action_type variations.
 */

import type { Campaign, Ad, DailyInsight } from './mock-data';
import type { FatigueStage } from './fatigue';

// ─── Constants ────────────────────────────────────────────────────────────────

const AOV_USD = 10; // default AOV — keep in sync with data-ingestion.ts
const BASELINE = { ctr: 3.8, cpc: 0.028, roas: 5.0 };

const GRADIENTS: [string, string][] = [
  ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#6366f1'], ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#f97316'], ['#ef4444', '#ec4899'], ['#8b5cf6', '#6366f1'],
  ['#f97316', '#ef4444'], ['#10b981', '#6366f1'], ['#38bdf8', '#6366f1'],
  ['#a78bfa', '#f59e0b'],
];

/** Action types Meta uses to report purchase conversions */
const PURCHASE_TYPES = new Set([
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
  'website_purchase',
  'omni_purchase',
  'onsite_web_purchase',
]);

// ─── Shared helpers ───────────────────────────────────────────────────────────

function n(v: unknown): number {
  if (v === null || v === undefined || v === '' || v === '-') return 0;
  const f = parseFloat(String(v));
  return isNaN(f) ? 0 : f;
}

function stageFromFreq(f: number): FatigueStage {
  return f < 2 ? 1 : f < 3.2 ? 2 : f < 4.5 ? 3 : 4;
}

function sumActions(actions: MetaAction[] = [], types: Set<string>): number {
  return actions
    .filter(a => types.has(a.action_type))
    .reduce((s, a) => s + n(a.value), 0);
}

// ─── Raw Meta API types (minimal — only fields we request) ───────────────────

interface MetaAction {
  action_type: string;
  value: string | number;
}

interface MetaInsightRow {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  frequency?: string;
  landing_page_views?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

interface MetaRawCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  insights?: { data: MetaInsightRow[] };
}

interface MetaCreative {
  thumbnail_url?: string;
  object_type?: string;
}

interface MetaAdSet {
  name?: string;
}

interface MetaRawAd {
  id: string;
  name: string;
  status: string;
  campaign_id?: string;
  adset_id?: string;
  adset?: MetaAdSet;
  creative?: MetaCreative;
  insights?: { data: MetaInsightRow[] };
}

// ─── Campaign mapper ──────────────────────────────────────────────────────────

export function mapMetaCampaigns(raws: MetaRawCampaign[]): Campaign[] {
  return (raws ?? []).map((raw, i) => {
    const ins: MetaInsightRow = raw.insights?.data?.[0] ?? {};

    const spend       = n(ins.spend);
    const impressions = n(ins.impressions);
    const reach       = n(ins.reach);
    const clicks      = n(ins.clicks);
    const cpc         = n(ins.cpc);
    const cpm         = n(ins.cpm);
    const ctr         = n(ins.ctr);
    // Prefer computed frequency; fall back to Meta's reported value
    const frequency   = reach > 0 ? impressions / reach : n(ins.frequency);

    const conversions   = sumActions(ins.actions, PURCHASE_TYPES);
    const reportedRev   = sumActions(ins.action_values, PURCHASE_TYPES);
    // Use pixel revenue if available, otherwise estimate via AOV
    const revenue       = reportedRev > 0 ? reportedRev : conversions * AOV_USD;
    const roas          = spend > 0 ? revenue / spend : 0;
    const cpa           = conversions > 0 ? spend / conversions : 0;

    const stage         = stageFromFreq(frequency);
    // daily_budget arrives in currency's minor unit (cents for USD accounts)
    const dailyBudget   = raw.daily_budget ? n(raw.daily_budget) / 100 : 0;

    return {
      id:           raw.id,
      name:         raw.name,
      status:       raw.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
      objective:    raw.objective ?? '',
      dailyBudget,
      spend, impressions, reach, clicks, cpc, cpm, ctr, frequency,
      roas, cpa, conversions, revenue,
      fatigueStage:  stage,
      fatigueScore:  Math.min(100, Math.round(frequency * 15)),
      ctrBaseline:   BASELINE.ctr,
      cpcBaseline:   BASELINE.cpc,
      roasBaseline:  BASELINE.roas,
      dailyData:     [],  // campaign-level endpoint has no daily breakdown
    };
  });
}

// ─── Ad mapper ────────────────────────────────────────────────────────────────

export function mapMetaAds(raws: MetaRawAd[]): Ad[] {
  return (raws ?? []).map((raw, i) => {
    const ins: MetaInsightRow = raw.insights?.data?.[0] ?? {};

    const spend             = n(ins.spend);
    const impressions       = n(ins.impressions);
    const reach             = n(ins.reach);
    const clicks            = n(ins.clicks);
    const landingPageViews  = n(ins.landing_page_views);
    const cpc               = n(ins.cpc);
    const cpm               = n(ins.cpm);
    const ctr               = n(ins.ctr);
    const frequency         = reach > 0 ? impressions / reach : n(ins.frequency);

    const conversions = sumActions(ins.actions, PURCHASE_TYPES);
    const reportedRev = sumActions(ins.action_values, PURCHASE_TYPES);
    const revenue     = reportedRev > 0 ? reportedRev : conversions * AOV_USD;
    const roas        = spend > 0 ? revenue / spend : 0;
    const cpa         = conversions > 0 ? spend / conversions : 0;
    const lpvRate     = clicks > 0 ? landingPageViews / clicks : 0;

    const stage       = stageFromFreq(frequency);
    // Detect video from object_type or creative thumbnail
    const objType     = raw.creative?.object_type?.toUpperCase() ?? '';
    const isVideo     = objType.includes('VIDEO');
    const [gFrom, gTo] = GRADIENTS[i % GRADIENTS.length];

    return {
      id:             raw.id,
      campaignId:     raw.campaign_id ?? '',
      campaignName:   '',         // not available at ad level without extra field
      adSetName:      raw.adset?.name ?? '',
      name:           raw.name,
      status:         raw.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
      creativeType:   isVideo ? 'VIDEO' : 'IMAGE',
      gradientFrom:   gFrom,
      gradientTo:     gTo,
      spend, impressions, reach, clicks, landingPageViews,
      cpc, cpm, ctr, frequency,
      roas, cpa, conversions, revenue,
      lpvRate,
      fatigueStage:   stage,
      fatigueScore:   Math.min(100, Math.round(frequency * 15)),
      ctrBaseline:    BASELINE.ctr,
      cpcBaseline:    BASELINE.cpc,
      roasBaseline:   BASELINE.roas,
      trendData:      [],
      hookRate:       0,
      holdRate:       0,
      qualityRanking:    'n/a',
      engagementRanking: 'n/a',
      conversionRanking: 'n/a',
    };
  });
}

// ─── Daily insights mapper ────────────────────────────────────────────────────

export function mapMetaDailyInsights(rows: MetaInsightRow[]): DailyInsight[] {
  return (rows ?? []).map(row => {
    const spend       = n(row.spend);
    const impressions = n(row.impressions);
    const reach       = n(row.reach);
    const clicks      = n(row.clicks);
    const cpc         = n(row.cpc);
    const cpm         = n(row.cpm);
    const ctr         = n(row.ctr);
    const frequency   = reach > 0 ? impressions / reach : n(row.frequency);

    const conversions = sumActions(row.actions, PURCHASE_TYPES);
    const reportedRev = sumActions(row.action_values, PURCHASE_TYPES);
    const revenue     = reportedRev > 0 ? reportedRev : conversions * AOV_USD;
    const roas        = spend > 0 ? revenue / spend : 0;
    const cpa         = conversions > 0 ? spend / conversions : 0;

    return {
      date:   row.date_start ?? '',
      spend, impressions, reach, clicks, cpc, cpm, ctr, frequency,
      roas, cpa, conversions, revenue,
    };
  });
}
