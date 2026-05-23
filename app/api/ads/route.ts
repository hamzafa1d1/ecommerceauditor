import { NextResponse } from 'next/server';
import { isMetaConfigured, fetchAds } from '@/lib/meta-api';
import { MOCK_ADS } from '@/lib/mock-data';
import { hasCsvData, hasAdsCsv, loadAds, loadCampaigns, campaignsAsAds } from '@/lib/data-ingestion';

export async function GET() {
  if (!isMetaConfigured()) {
    let data, source: string;
    if (hasAdsCsv()) {
      data   = loadAds();
      source = 'csv-ads';
    } else if (hasCsvData()) {
      data   = campaignsAsAds(loadCampaigns());
      source = 'csv';
    } else {
      data   = MOCK_ADS;
      source = 'mock';
    }
    return NextResponse.json({ data, source });
  }
  try {
    const data = await fetchAds();
    return NextResponse.json({ data, source: 'meta' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
