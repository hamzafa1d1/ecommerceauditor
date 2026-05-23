import { NextRequest, NextResponse } from 'next/server';
import { isMetaConfigured, fetchInsights, type DateRange } from '@/lib/meta-api';
import {
  MOCK_DAILY_INSIGHTS, MOCK_KPI_CURRENT, MOCK_KPI_PREV,
  MOCK_FATIGUE_CURVE, MOCK_CPM_TREND, MOCK_HEATMAP,
} from '@/lib/mock-data';
import {
  hasCsvData, loadCampaigns, computeKpis,
  generateDailyInsights, generateCpmTrend, generateHeatmap,
} from '@/lib/data-ingestion';

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get('range') ?? 'last_30d') as DateRange;

  if (!isMetaConfigured()) {
    if (hasCsvData()) {
      const campaigns = loadCampaigns();
      const { current, prev } = computeKpis(campaigns);
      return NextResponse.json({
        daily:          generateDailyInsights(campaigns),
        kpiCurrent:     current,
        kpiPrev:        prev,
        fatigueCurve:   MOCK_FATIGUE_CURVE,   // conceptual curve stays synthetic
        cpmTrend:       generateCpmTrend(campaigns),
        heatmap:        generateHeatmap(campaigns),
        source:         'csv',
        syntheticDaily: true,
      });
    }
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

  try {
    const data = await fetchInsights(range);
    return NextResponse.json({ data, source: 'meta' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
