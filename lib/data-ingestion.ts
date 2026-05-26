/**
 * Data ingestion pipeline — reads CSV files from data/ and transforms
 * them into the types the dashboard already expects.
 *
 * Data source priority (highest wins):
 *   1. Meta API  (META_ACCESS_TOKEN configured)
 *   2. CSV files (data/campaigns.csv present)
 *   3. Mock data (fallback, always available)
 *
 * Future CSV tiers — add the file to data/ and the matching loader picks it up:
 *   data/campaigns.csv  ← current: campaign-level aggregate
 *   data/daily.csv      ← add this to unlock real per-day charts
 *   data/ads.csv        ← add this to unlock per-ad creative analysis
 *
 * To export each tier from Meta Ads Manager:
 *   Campaigns: Ads Manager → Campaigns tab → set date range → Columns:
 *     "Performance and Clicks" + LPV rate / hook rate / hold rate → Export CSV
 *   Daily:     same but toggle Breakdown → Time → Day
 *   Ads:       same but go to Ads tab, not Campaigns
 */

import fs   from 'fs';
import path from 'path';
import { parseCsv, num } from './csv-parser';
import type { FatigueStage } from './fatigue';
import type { Campaign, Ad, DailyInsight } from './mock-data';

const DATA_DIR = path.join(process.cwd(), 'data');

// Primary report files dropped at the project root by the user.
// These take precedence over the fallback data/ folder files.
// To swap to a new export, replace either file — column names must match Meta Ads Manager format.
const PRIMARY_CAMPAIGNS_CSV = path.join(process.cwd(), 'adname-report.csv');
const PRIMARY_ADS_CSV       = path.join(process.cwd(), 'Untitled-report-Apr-23-2023-to-May-23-2026 (1).csv');

// ─── File availability checks ─────────────────────────────────────────────────

export function hasCsvData():  boolean {
  return fs.existsSync(PRIMARY_CAMPAIGNS_CSV) || fs.existsSync(path.join(DATA_DIR, 'campaigns.csv'));
}
export function hasDailyCsv(): boolean { return fs.existsSync(path.join(DATA_DIR, 'daily.csv')); }
export function hasAdsCsv():   boolean {
  return fs.existsSync(PRIMARY_ADS_CSV) || fs.existsSync(path.join(DATA_DIR, 'ads.csv'));
}

// ─── Extended Campaign type ───────────────────────────────────────────────────
// Superset of Campaign — the extra fields are rendered in the campaign table
// and will power the creative analysis columns in future iterations.

export type CsvCampaign = Campaign & {
  hookRate:       number;   // % who watched first 3 seconds  (video quality signal)
  holdRate:       number;   // % who watched 25%+ of video    (content quality signal)
  lpvRate:        number;   // LPV / link clicks              (landing-page efficiency)
  conversionRate: number;   // Purchases / LPV                (checkout efficiency)
  reportingStart: string;
  reportingEnd:   string;
  syntheticDaily: boolean;  // true = dailyData is estimated, not real breakdown
};

// ─── Account baselines (estimated from best fresh campaigns in this account) ──

const BASELINE = { ctr: 3.8, cpc: 0.028, roas: 5.0 };

/** Total days covered by the current CSV export */
const PERIOD_DAYS = 332; // 2025-06-25 → 2026-05-23

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADIENTS: [string, string][] = [
  ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#6366f1'], ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#f97316'], ['#ef4444', '#ec4899'], ['#8b5cf6', '#6366f1'],
  ['#f97316', '#ef4444'], ['#10b981', '#6366f1'], ['#38bdf8', '#6366f1'],
  ['#a78bfa', '#f59e0b'],
];

/** Deterministic pseudo-variation — same seed always gives same value */
function det(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) / 2;
}

function buildDates(n: number, end = '2026-05-23'): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

const LAST_30 = buildDates(30);
const LAST_7  = buildDates(7);

function stageFromFreq(f: number): FatigueStage {
  return f < 2 ? 1 : f < 3.2 ? 2 : f < 4.5 ? 3 : 4;
}

function computeFatigueScore(freq: number, hookRate: number): number {
  const base    = Math.min(60, freq * 13);
  const penalty = hookRate > 0.005 ? Math.max(0, (0.35 - hookRate) * 40) : 0;
  return Math.min(100, Math.round(base + penalty));
}

// Per-day slope for each metric by fatigue stage
const SLOPES: Record<FatigueStage, { ctr: number; cpc: number; cpm: number; freq: number }> = {
  1: { ctr: +0.010, cpc: -0.0005, cpm: -0.008, freq: +0.01 },
  2: { ctr: -0.020, cpc: +0.0015, cpm: +0.015, freq: +0.04 },
  3: { ctr: -0.040, cpc: +0.0030, cpm: +0.035, freq: +0.07 },
  4: { ctr: -0.065, cpc: +0.0060, cpm: +0.065, freq: +0.11 },
};

function makeTrendData(
  ctr: number, cpc: number, cpm: number, freq: number,
  stage: FatigueStage, seed: number,
) {
  const s = SLOPES[stage];
  return LAST_7.map((date, i) => ({
    date,
    ctr:       Math.max(0.1,  +((ctr  + s.ctr  * (i - 6) + det(seed + i)     * 0.04).toFixed(2))),
    cpc:       Math.max(0.01, +((cpc  + s.cpc  * (i - 6) + det(seed + i + 1) * 0.001).toFixed(4))),
    cpm:       Math.max(0.1,  +((cpm  + s.cpm  * (i - 6) + det(seed + i + 2) * 0.04).toFixed(2))),
    frequency: Math.max(1,    +((freq + s.freq * (i - 6) + det(seed + i + 3) * 0.02).toFixed(2))),
  }));
}

function makeDailyData(
  spend: number, roas: number, ctr: number, cpm: number,
  stage: FatigueStage, seed: number,
) {
  const daily = spend / PERIOD_DAYS;
  const s = SLOPES[stage];
  return LAST_7.map((date, i) => ({
    date,
    spend: Math.max(0, +((daily * (0.92 + det(seed + i + 7) * 0.16)).toFixed(2))),
    roas:  Math.max(0.1, +((roas + s.ctr * (i - 6) * 0.4  + det(seed + i + 4) * 0.1).toFixed(2))),
    ctr:   Math.max(0.1, +((ctr  + s.ctr * (i - 6)        + det(seed + i + 5) * 0.05).toFixed(2))),
    cpm:   Math.max(0.1, +((cpm  + s.cpm * (i - 6)        + det(seed + i + 6) * 0.05).toFixed(2))),
  }));
}

// ─── loadCampaigns ────────────────────────────────────────────────────────────

export function loadCampaigns(aovUsd = 10): CsvCampaign[] {
  // Prefer root-level export; fall back to data/campaigns.csv
  const filePath = fs.existsSync(PRIMARY_CAMPAIGNS_CSV)
    ? PRIMARY_CAMPAIGNS_CSV
    : path.join(DATA_DIR, 'campaigns.csv');
  const raw  = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(raw);

  return rows
    .filter(r => r['Campaign name'] && num(r['Amount spent (USD)']) > 0)
    .map((row, i): CsvCampaign => {
      const spend       = num(row['Amount spent (USD)']);
      const impressions = num(row['Impressions']);
      const reach       = num(row['Reach']);
      const clicks      = num(row['Link clicks']);
      const freq        = num(row['Frequency']);
      const cpc         = num(row['CPC (cost per link click)']);
      const cpm         = num(row['CPM (cost per 1,000 impressions)']);
      const ctr         = num(row['CTR (link click-through rate)']);
      const conversions = num(row['Results']);
      const cpa         = conversions > 0 ? spend / conversions : 0;
      const hookRate    = num(row['hook rate']);
      const holdRate    = num(row['hold rate']);
      const lpvRate     = num(row['LPV rate']);
      const convRate    = num(row['Purchases rate per landing page views']);
      const revenue     = conversions * aovUsd;
      const roas        = spend > 0 ? revenue / spend : 0;
      const stage       = stageFromFreq(freq);
      const score       = computeFatigueScore(freq, hookRate);
      const seed        = i * 31;
      const g           = GRADIENTS[i % GRADIENTS.length];

      return {
        id:          `csv_${i}`,
        name:        row['Campaign name'],
        status:      row['Delivery status'] === 'active' ? 'ACTIVE' : 'PAUSED',
        objective:   row['Result type'] || 'CONVERSIONS',
        dailyBudget: +((spend / PERIOD_DAYS) * 1.3).toFixed(2),
        spend, impressions, reach, clicks, cpc, cpm, ctr,
        frequency:    freq,
        roas, cpa, conversions, revenue,
        fatigueStage:  stage,
        fatigueScore:  score,
        ctrBaseline:   BASELINE.ctr,
        cpcBaseline:   BASELINE.cpc,
        roasBaseline:  BASELINE.roas,
        dailyData: makeDailyData(spend, roas, ctr, cpm, stage, seed),
        // CSV-specific extra fields
        hookRate, holdRate, lpvRate,
        conversionRate: convRate,
        reportingStart: row['Reporting starts'] || '',
        reportingEnd:   row['Reporting ends']   || '',
        syntheticDaily: true,
      };
    });
}

// ─── computeKpis ──────────────────────────────────────────────────────────────
// current = active campaigns only
// prev    = all campaigns (proxy for a prior-period baseline)

export function computeKpis(campaigns: CsvCampaign[], aovUsd = 10) {
  function agg(cs: CsvCampaign[]) {
    const spend       = cs.reduce((s, c) => s + c.spend,       0);
    const impressions = cs.reduce((s, c) => s + c.impressions, 0);
    const reach       = cs.reduce((s, c) => s + c.reach,       0);
    const clicks      = cs.reduce((s, c) => s + c.clicks,      0);
    const conversions = cs.reduce((s, c) => s + c.conversions, 0);
    const revenue     = conversions * aovUsd;
    return {
      spend, revenue,
      roas:      spend > 0       ? revenue / spend              : 0,
      cpm:       impressions > 0 ? (spend / impressions) * 1000 : 0,
      ctr:       impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc:       clicks > 0      ? spend / clicks               : 0,
      cpa:       conversions > 0 ? spend / conversions          : 0,
      reach, impressions,
      frequency: reach > 0 ? impressions / reach : 0,
      conversions,
    };
  }
  return {
    current: agg(campaigns.filter(c => c.status === 'ACTIVE')),
    prev:    agg(campaigns),
  };
}

// ─── generateDailyInsights ────────────────────────────────────────────────────
// Synthetic 30-day series derived from aggregate totals.
// Automatically replaced when data/daily.csv is present (future iteration).

export function generateDailyInsights(campaigns: CsvCampaign[], aovUsd = 10): DailyInsight[] {
  const active = campaigns.filter(c => c.status === 'ACTIVE');
  if (!active.length) return [];

  const totalImpr  = active.reduce((s, c) => s + c.impressions, 0);
  const wtdCtr     = active.reduce((s, c) => s + c.ctr       * c.impressions, 0) / totalImpr;
  const wtdCpm     = active.reduce((s, c) => s + c.cpm       * c.impressions, 0) / totalImpr;
  const wtdFreq    = active.reduce((s, c) => s + c.frequency * c.impressions, 0) / totalImpr;
  const dailySpend = active.reduce((s, c) => s + c.spend,       0) / PERIOD_DAYS;
  const dailyConv  = active.reduce((s, c) => s + c.conversions, 0) / PERIOD_DAYS;

  return LAST_30.map((date, i) => {
    const t           = i / 29; // 0 (oldest) → 1 (newest)
    const spend       = +((dailySpend * (0.88 + t * 0.24)).toFixed(2));
    const cpm         = +((wtdCpm     * (1 + t * 0.10)).toFixed(2));
    const ctr         = +((wtdCtr     * (1 - t * 0.14)).toFixed(2));
    const frequency   = +((wtdFreq    * (1 + t * 0.12)).toFixed(2));
    const impressions = cpm > 0 ? Math.round((spend / cpm) * 1000) : 0;
    const clicks      = Math.round(impressions * ctr / 100);
    const reach       = frequency > 0 ? Math.round(impressions / frequency) : 0;
    const cpc         = clicks > 0 ? +(spend / clicks).toFixed(4) : 0;
    const conversions = Math.round(dailyConv * (0.93 + t * 0.14));
    const cpa         = conversions > 0 ? +(spend / conversions).toFixed(2) : 0;
    const revenue     = conversions * aovUsd;
    const roas        = spend > 0 ? +(revenue / spend).toFixed(2) : 0;
    return { date, spend, impressions, reach, clicks, cpc, cpm, ctr, frequency, roas, cpa, conversions, revenue };
  });
}

// ─── campaignsAsAds ───────────────────────────────────────────────────────────
// Top-20 campaigns by spend treated as individual ad creatives.
// Replaced when data/ads.csv is present (future iteration).

// ─── campaignsAsAds ───────────────────────────────────────────────────────────
// Top-20 campaigns by spend treated as individual ad creatives.
// Replaced when data/ads.csv is present (future iteration).

function parseRanking(v: string): 'above' | 'average' | 'below' | 'n/a' {
  if (!v || v === '-') return 'n/a';
  const lv = v.toLowerCase();
  if (lv.includes('above')) return 'above';
  if (lv.includes('below')) return 'below';
  return 'average';
}

export function loadAds(aovUsd = 10): Ad[] {
  // Prefer root-level ad export; fall back to data/ads.csv
  const filePath = fs.existsSync(PRIMARY_ADS_CSV)
    ? PRIMARY_ADS_CSV
    : path.join(DATA_DIR, 'ads.csv');
  const raw  = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(raw);

  return rows
    .filter(r => r['Ad name'] && num(r['Amount spent (USD)']) > 0)
    .map((row, i): Ad => {
      const spend       = num(row['Amount spent (USD)']);
      const impressions = num(row['Impressions']);
      const reach       = num(row['Reach']);
      const clicks      = num(row['Link clicks']);
      const freq        = num(row['Frequency']);
      const cpc         = num(row['CPC (cost per link click)']);
      const cpm         = num(row['CPM (cost per 1,000 impressions)']);
      const ctr         = num(row['CTR (link click-through rate)']);
      const conversions = num(row['Results']);
      const lpv         = num(row['Landing page views']);
      const hookRate    = num(row['hook rate']);
      const holdRate    = num(row['hold rate']);
      const lpvRate     = num(row['LPV rate']);
      const cpa         = conversions > 0 ? spend / conversions : 0;
      const revenue     = conversions * aovUsd;
      const roas        = spend > 0 ? revenue / spend : 0;
      const stage       = stageFromFreq(freq);
      const score       = computeFatigueScore(freq, hookRate);
      const g           = GRADIENTS[i % GRADIENTS.length];

      return {
        id:              `adcsv_${i}`,
        campaignId:      `adcsv_${i}`,
        campaignName:    row['Ad name'],
        adSetName:       '',
        name:            row['Ad name'],
        status:          row['Delivery status'] === 'active' ? 'ACTIVE' : 'PAUSED',
        creativeType:    hookRate > 0.005 ? 'VIDEO' : 'IMAGE',
        gradientFrom:    g[0],
        gradientTo:      g[1],
        spend, impressions, reach, clicks,
        landingPageViews: lpv,
        cpc, cpm, ctr,
        frequency: freq,
        roas, cpa, conversions, revenue,
        fatigueStage:  stage,
        fatigueScore:  score,
        ctrBaseline:   BASELINE.ctr,
        cpcBaseline:   BASELINE.cpc,
        roasBaseline:  BASELINE.roas,
        trendData:     makeTrendData(ctr, cpc, cpm, freq, stage, i * 31),
        hookRate,
        holdRate,
        lpvRate,
        qualityRanking:    parseRanking(row['Quality ranking']),
        engagementRanking: parseRanking(row['Engagement rate ranking']),
        conversionRanking: parseRanking(row['Conversion rate ranking']),
        costPerResult: num(row['Cost per result']) || cpa,
        resultType:    row['Result type'] || undefined,
      };
    });
}

export function campaignsAsAds(campaigns: CsvCampaign[]): Ad[] {
  return campaigns
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 20)
    .map((c, i): Ad => ({
      id:              `ad_${c.id}`,
      campaignId:      c.id,
      campaignName:    c.name,
      adSetName:       'Campaign Level',
      name:            c.name,
      status:          c.status,
      creativeType:    c.hookRate > 0.005 ? 'VIDEO' : 'IMAGE',
      gradientFrom:    GRADIENTS[i % GRADIENTS.length][0],
      gradientTo:      GRADIENTS[i % GRADIENTS.length][1],
      spend:           c.spend,
      impressions:     c.impressions,
      reach:           c.reach,
      clicks:          c.clicks,
      landingPageViews: Math.round(c.clicks * c.lpvRate),
      cpc:             c.cpc,
      cpm:             c.cpm,
      ctr:             c.ctr,
      frequency:       c.frequency,
      roas:            c.roas,
      cpa:             c.cpa,
      conversions:     c.conversions,
      revenue:         c.revenue,
      fatigueStage:    c.fatigueStage,
      fatigueScore:    c.fatigueScore,
      ctrBaseline:     c.ctrBaseline,
      cpcBaseline:     c.cpcBaseline,
      roasBaseline:    c.roasBaseline,
      trendData:       makeTrendData(c.ctr, c.cpc, c.cpm, c.frequency, c.fatigueStage, i * 31),
      hookRate:        c.hookRate,
      holdRate:        c.holdRate,
      lpvRate:         c.lpvRate,
      qualityRanking:    'n/a' as const,
      engagementRanking: 'n/a' as const,
      conversionRanking: 'n/a' as const,
      resultType:        c.objective && c.objective !== 'CONVERSIONS' ? c.objective : undefined,
    }));
}

// ─── generateCpmTrend ─────────────────────────────────────────────────────────

export function generateCpmTrend(campaigns: CsvCampaign[]) {
  const top5 = campaigns
    .filter(c => c.status === 'ACTIVE')
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return LAST_30.map((date, i) => {
    const row: Record<string, unknown> = { date };
    top5.forEach((c, ci) => {
      const slope = SLOPES[c.fatigueStage].cpm;
      row[`camp${ci + 1}`] = Math.max(0.1, +((c.cpm + slope * (i - 29)).toFixed(2)));
    });
    return row;
  });
}

// ─── generateHeatmap ──────────────────────────────────────────────────────────

export function generateHeatmap(campaigns: CsvCampaign[]) {
  return campaigns
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15)
    .map(c => ({
      adId:   c.id,
      adName: c.name.slice(0, 28),
      stage:  c.fatigueStage,
      values: buildDates(14).map((date, i) => ({
        date,
        frequency: Math.max(1, +((c.frequency + SLOPES[c.fatigueStage].freq * (i - 13)).toFixed(2))),
      })),
    }));
}
