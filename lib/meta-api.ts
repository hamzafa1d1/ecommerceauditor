/**
 * Meta Marketing API client — all calls are server-side only.
 * The access token is read from process.env or passed explicitly.
 * Never send credentials to the browser.
 *
 * Priority: explicit creds (from cookies) > env vars > CSV fallback > mock
 */

const BASE = 'https://graph.facebook.com/v21.0';

function envToken(): string {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new Error('META_ACCESS_TOKEN is not set');
  return t;
}

function envAccountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error('META_AD_ACCOUNT_ID is not set');
  return id.startsWith('act_') ? id : `act_${id}`;
}

function fmtAccountId(id: string): string {
  return id.startsWith('act_') ? id : `act_${id}`;
}

/** Build fetch init with Authorization header — token never goes in the URL */
function authInit(tok: string): RequestInit {
  return {
    headers: { Authorization: `Bearer ${tok}` },
    next: { revalidate: 300 },
  };
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

export async function fetchCampaignsWithCreds(tok: string, acctId: string) {
  const url = new URL(`${BASE}/${fmtAccountId(acctId)}/campaigns`);
  url.searchParams.set('fields', CAMPAIGN_FIELDS);
  url.searchParams.set('limit', '25');

  const res = await fetch(url.toString(), authInit(tok));
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchCampaigns() {
  return fetchCampaignsWithCreds(envToken(), envAccountId());
}

// ─── Ads ─────────────────────────────────────────────────────────────────────

const AD_FIELDS = [
  'id', 'name', 'status', 'adset_id', 'adset{name}', 'campaign_id',
  'creative{thumbnail_url,object_type}',
  'insights.date_preset(last_30_d){spend,impressions,reach,clicks,cpc,cpm,ctr,frequency,actions,action_values,landing_page_views}',
].join(',');

export async function fetchAdsWithCreds(tok: string, acctId: string) {
  const url = new URL(`${BASE}/${fmtAccountId(acctId)}/ads`);
  url.searchParams.set('fields', AD_FIELDS);
  url.searchParams.set('limit', '50');

  const res = await fetch(url.toString(), authInit(tok));
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchAds() {
  return fetchAdsWithCreds(envToken(), envAccountId());
}

// ─── Account-level insights (overview) ───────────────────────────────────────

export async function fetchInsightsWithCreds(tok: string, acctId: string, range: DateRange = 'last_30d') {
  const fields = 'spend,impressions,reach,clicks,cpc,cpm,ctr,frequency,actions,action_values';
  const url = new URL(`${BASE}/${fmtAccountId(acctId)}/insights`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('date_preset', datePreset(range));
  url.searchParams.set('time_increment', '1');

  const res = await fetch(url.toString(), authInit(tok));
  if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function fetchInsights(range: DateRange = 'last_30d') {
  return fetchInsightsWithCreds(envToken(), envAccountId(), range);
}
