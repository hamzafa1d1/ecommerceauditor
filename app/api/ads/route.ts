import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAdsWithCreds } from '@/lib/meta-api';
import { mapMetaAds } from '@/lib/meta-mapper';
import { MOCK_ADS } from '@/lib/mock-data';
import { hasCsvData, hasAdsCsv, loadAds, loadCampaigns, campaignsAsAds } from '@/lib/data-ingestion';

export async function GET() {
  const jar = await cookies();
  const cookieToken   = jar.get('meta_token')?.value;
  const cookieAccount = jar.get('meta_account_id')?.value;

  const tok    = cookieToken   ?? process.env.META_ACCESS_TOKEN;
  const acctId = cookieAccount ?? process.env.META_AD_ACCOUNT_ID;

  if (!tok || !acctId) {
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
    const result = await fetchAdsWithCreds(tok, acctId);
    const data   = mapMetaAds(result?.data ?? []);
    return NextResponse.json({ data, source: 'meta' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
