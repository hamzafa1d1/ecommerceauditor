import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchCampaignsWithCreds } from '@/lib/meta-api';
import { mapMetaCampaigns } from '@/lib/meta-mapper';
import { MOCK_CAMPAIGNS } from '@/lib/mock-data';
import { hasCsvData, loadCampaigns } from '@/lib/data-ingestion';

export async function GET() {
  const jar = await cookies();
  const cookieToken   = jar.get('meta_token')?.value;
  const cookieAccount = jar.get('meta_account_id')?.value;

  const tok    = cookieToken   ?? process.env.META_ACCESS_TOKEN;
  const acctId = cookieAccount ?? process.env.META_AD_ACCOUNT_ID;

  if (!tok || !acctId) {
    const data   = hasCsvData() ? loadCampaigns() : MOCK_CAMPAIGNS;
    const source = hasCsvData() ? 'csv'           : 'mock';
    return NextResponse.json({ data, source });
  }
  try {
    const result = await fetchCampaignsWithCreds(tok, acctId);
    const data   = mapMetaCampaigns(result?.data ?? []);
    return NextResponse.json({ data, source: 'meta' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
