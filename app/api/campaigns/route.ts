import { NextResponse } from 'next/server';
import { isMetaConfigured, fetchCampaigns } from '@/lib/meta-api';
import { MOCK_CAMPAIGNS } from '@/lib/mock-data';
import { hasCsvData, loadCampaigns } from '@/lib/data-ingestion';

export async function GET() {
  if (!isMetaConfigured()) {
    const data   = hasCsvData() ? loadCampaigns() : MOCK_CAMPAIGNS;
    const source = hasCsvData() ? 'csv'           : 'mock';
    return NextResponse.json({ data, source });
  }
  try {
    const data = await fetchCampaigns();
    return NextResponse.json({ data, source: 'meta' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
