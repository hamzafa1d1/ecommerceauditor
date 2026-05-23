/**
 * Meta Marketing API client — all calls are server-side only.
 * The access token is read from process.env and never sent to the browser.
 *
 * When META_ACCESS_TOKEN and META_AD_ACCOUNT_ID are not set,
 * API routes fall back to mock data automatically.
 */

const BASE = 'https://graph.facebook.com/v21.0';

function token(): string {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error('META_ACCESS_TOKEN is not set');
  return t;
}

function accountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error('META_AD_ACCOUNT_ID is not set');
  return id.startsWith('act_') ? id : `act_${id}`;
}

export function isMetaConfigured(): boolean {
  return !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

// ─── Date range helper ───────────────────────────────────────────────────────

export type DateRange = 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d';

export function datePreset(range: DateRange): string {
  const map: Record<DateRange, string> = {
    last_7d:  'last_7_d',
    last_14d: 'last_14_d',
    last_30d: 'last_30_d',
    last_90d: 'last_90_d',
  };
  return map[range];
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

const CAMPAIGN_FIELDS = [
  'id', 'name', 'status', 'objective', 'daily_budget',
  'insights.date_preset(last_30_d){spend,impressions,reach,clicks,cpc,cpm,ctr,frequency,actions,action_values}',
].join(',');

export async function fetchCampaigns() {
  const url = new URL(`${BASE}/${accountId()}/campaigns`);
  url.searchParams.set('fields', CAMPAIGN_FIELDS);
  url.searchParams.set('limit', '25');
  url.searchParams.set('access_token', token());

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Ads ─────────────────────────────────────────────────────────────────────

const AD_FIELDS = [
  'id', 'name', 'status', 'adset_id', 'adset{name}', 'campaign_id',
  'creative{thumbnail_url,object_type}',
  'insights.date_preset(last_30_d){spend,impressions,reach,clicks,cpc,cpm,ctr,frequency,actions,action_values,landing_page_views}',
].join(',');

export async function fetchAds() {
  const url = new URL(`${BASE}/${accountId()}/ads`);
  url.searchParams.set('fields', AD_FIELDS);
  url.searchParams.set('limit', '50');
  url.searchParams.set('access_token', token());

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Account-level insights (overview) ───────────────────────────────────────

export async function fetchInsights(range: DateRange = 'last_30d') {
  const fields = 'spend,impressions,reach,clicks,cpc,cpm,ctr,frequency,actions,action_values';
  const url = new URL(`${BASE}/${accountId()}/insights`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('date_preset', datePreset(range));
  url.searchParams.set('time_increment', '1');  // daily breakdown
  url.searchParams.set('access_token', token());

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}
