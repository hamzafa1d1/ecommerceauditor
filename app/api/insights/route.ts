import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchInsightsWithCreds, type DateRange } from '@/lib/meta-api';
import { mapMetaDailyInsights } from '@/lib/meta-mapper';
import {
  MOCK_DAILY_INSIGHTS, MOCK_KPI_CURRENT, MOCK_KPI_PREV,
  MOCK_FATIGUE_CURVE, MOCK_CPM_TREND, MOCK_HEATMAP,
} from '@/lib/mock-data';
import {
  hasCsvData, loadCampaigns, computeKpis,
  generateDailyInsights, generateCpmTrend, generateHeatmap,
} from '@/lib/data-ingestion';
import type { DailyInsight } from '@/lib/mock-data';

/** Aggregate an array of DailyInsight rows into a single KPI snapshot. */
function aggregateDaily(rows: DailyInsight[]) {
  if (!rows.length) return MOCK_KPI_CURRENT;
  const spend       = rows.reduce((s, r) => s + r.spend,       0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const reach       = rows.reduce((s, r) => s + r.reach,       0);
  const clicks      = rows.reduce((s, r) => s + r.clicks,      0);
  const conversions = rows.reduce((s, r) => s + r.conversions, 0);
  const revenue     = rows.reduce((s, r) => s + r.revenue,     0);
  return {
    spend, revenue, conversions,
    roas:      spend > 0       ? revenue / spend              : 0,
    cpm:       impressions > 0 ? (spend / impressions) * 1000 : 0,
    ctr:       impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc:       clicks > 0      ? spend / clicks               : 0,
    cpa:       conversions > 0 ? spend / conversions          : 0,
    reach, impressions,
    frequency: reach > 0 ? impressions / reach : 0,
  };
}

/** Build CSV-based insights response — reused whether Meta fails or not configured. */
function csvInsights() {
  const campaigns = loadCampaigns();
  const { current, prev } = computeKpis(campaigns);
  return {
    daily:          generateDailyInsights(campaigns),
    kpiCurrent:     current,
    kpiPrev:        prev,
    fatigueCurve:   MOCK_FATIGUE_CURVE,
    cpmTrend:       generateCpmTrend(campaigns),
    heatmap:        generateHeatmap(campaigns),
    source:         'csv',
    syntheticDaily: true,
  };
}

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get('range') ?? 'last_30d') as DateRange;

  const jar = await cookies();
  const cookieToken   = jar.get('meta_token')?.value;
  const cookieAccount = jar.get('meta_account_id')?.value;

  const tok    = cookieToken   ?? process.env.META_ACCESS_TOKEN;
  const acctId = cookieAccount ?? process.env.META_AD_ACCOUNT_ID;

  // No credentials — use CSV or mock
  if (!tok || !acctId) {
    if (hasCsvData()) return NextResponse.json(csvInsights());
    return NextResponse.json({
      daily:        MOCK_DAILY_INSIGHTS,
      kpiCurrent:   MOCK_KPI_CURRENT,
      kpiPrev:      MOCK_KPI_PREV,
      fatigueCurve: MOCK_FATIGUE_CURVE,
      cpmTrend:     MOCK_CPM_TREND,
      heatmap:      MOCK_HEATMAP,
      source:       'mock',
    });
  }

  // Meta credentials present — try live data, fall back to CSV on any error
  try {
    const result = await fetchInsightsWithCreds(tok, acctId, range);
    const rawRows = Array.isArray(result?.data) ? result.data : [];
    const daily   = mapMetaDailyInsights(rawRows);

    if (!daily.length) throw new Error('Meta API returned no daily rows');

    // Split: second half = "current period", first half = "prev period" for KPI deltas
    const mid  = Math.floor(daily.length / 2);
    const curr = daily.slice(mid);
    const prev = daily.slice(0, mid);

    return NextResponse.json({
      daily,
      kpiCurrent:     aggregateDaily(curr),
      kpiPrev:        aggregateDaily(prev.length ? prev : curr),
      fatigueCurve:   MOCK_FATIGUE_CURVE,  // no per-creative breakdown from insights endpoint
      cpmTrend:       MOCK_CPM_TREND,
      heatmap:        MOCK_HEATMAP,
      source:         'meta',
      syntheticDaily: false,
    });
  } catch (err) {
    // Meta insights failed — fall back gracefully rather than returning 500
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (hasCsvData()) {
      return NextResponse.json({ ...csvInsights(), metaInsightsError: message });
    }
    return NextResponse.json({
      daily:        MOCK_DAILY_INSIGHTS,
      kpiCurrent:   MOCK_KPI_CURRENT,
      kpiPrev:      MOCK_KPI_PREV,
      fatigueCurve: MOCK_FATIGUE_CURVE,
      cpmTrend:     MOCK_CPM_TREND,
      heatmap:      MOCK_HEATMAP,
      source:       'mock',
      metaInsightsError: message,
    });
  }
}
