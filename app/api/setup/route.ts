/**
 * /api/setup — store and validate Meta Ad Account credentials.
 *
 * POST  { token, accountId }  → validate against Meta Graph API, save to httpOnly cookies
 * GET                         → return current connection status (no token value exposed)
 * DELETE                      → clear stored credentials
 *
 * The token is stored in an httpOnly cookie so it is never accessible
 * from client-side JavaScript.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GRAPH = 'https://graph.facebook.com/v21.0';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 60, // 60 days
} as const;

// ─── POST: validate token + accountId, then persist in cookies ────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, accountId } = body as Record<string, unknown>;

  if (!token || typeof token !== 'string' || token.trim().length < 20) {
    return NextResponse.json({ error: 'A valid access token is required (minimum 20 characters).' }, { status: 400 });
  }
  if (!accountId || typeof accountId !== 'string') {
    return NextResponse.json({ error: 'Ad Account ID is required.' }, { status: 400 });
  }

  // Normalise: strip act_ prefix for storage, add it back for API calls
  const cleanId = accountId.replace(/^act_/, '').trim();
  if (!/^\d+$/.test(cleanId)) {
    return NextResponse.json({ error: 'Ad Account ID must be numeric (e.g. 1234567890 or act_1234567890).' }, { status: 400 });
  }

  const tok = token.trim();

  // 1. Verify the token itself is valid
  let userName = '';
  try {
    const meRes = await fetch(`${GRAPH}/me?fields=id,name`, {
      headers: { Authorization: `Bearer ${tok}` },
      cache: 'no-store',
    });
    if (!meRes.ok) {
      const err = await meRes.json() as { error?: { message?: string } };
      return NextResponse.json(
        { error: err?.error?.message ?? 'Access token is invalid or expired.' },
        { status: 401 },
      );
    }
    const me = await meRes.json() as { name?: string };
    userName = me.name ?? '';
  } catch {
    return NextResponse.json({ error: 'Could not reach Meta API. Check your internet connection.' }, { status: 502 });
  }

  // 2. Verify the token has access to the requested ad account
  let accountName = '';
  try {
    const acctRes = await fetch(`${GRAPH}/act_${cleanId}?fields=id,name,account_status`, {
      headers: { Authorization: `Bearer ${tok}` },
      cache: 'no-store',
    });
    if (!acctRes.ok) {
      const err = await acctRes.json() as { error?: { message?: string } };
      return NextResponse.json(
        { error: err?.error?.message ?? 'Cannot access that ad account. Verify the account ID and that the token has ads_read permission.' },
        { status: 403 },
      );
    }
    const acct = await acctRes.json() as { name?: string; account_status?: number };
    accountName = acct.name ?? `Account ${cleanId}`;
    // account_status 1 = active, 2 = disabled, 3 = unsettled, etc.
    if (acct.account_status !== undefined && acct.account_status !== 1) {
      return NextResponse.json(
        { error: `Ad account is not active (status ${acct.account_status}). Only active accounts can be connected.` },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Could not reach Meta API when verifying ad account.' }, { status: 502 });
  }

  // 3. Store in httpOnly cookies — token never touches the client
  const jar = await cookies();
  jar.set('meta_token', tok, COOKIE_OPTS);
  jar.set('meta_account_id', cleanId, COOKIE_OPTS);
  jar.set('meta_account_name', accountName, { ...COOKIE_OPTS, httpOnly: false }); // safe to expose

  return NextResponse.json({ ok: true, accountName, userName });
}

// ─── GET: connection status only (token value is never returned) ──────────────

export async function GET() {
  const jar = await cookies();
  const hasToken   = !!jar.get('meta_token')?.value;
  const accountId  = jar.get('meta_account_id')?.value ?? null;
  const accountName = jar.get('meta_account_name')?.value ?? null;

  return NextResponse.json({ connected: hasToken, accountId, accountName });
}

// ─── DELETE: disconnect ───────────────────────────────────────────────────────

export async function DELETE() {
  const jar = await cookies();
  jar.delete('meta_token');
  jar.delete('meta_account_id');
  jar.delete('meta_account_name');
  return NextResponse.json({ ok: true });
}
