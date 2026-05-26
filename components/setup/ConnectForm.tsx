'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Link2, Trash2 } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  accountId: string | null;
  accountName: string | null;
}

interface ConnectFormProps {
  initialStatus: ConnectionStatus;
}

export function ConnectForm({ initialStatus }: ConnectFormProps) {
  const router = useRouter();
  const [status, setStatus]     = useState<ConnectionStatus>(initialStatus);
  const [token, setToken]       = useState('');
  const [accountId, setAccountId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accountId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; accountName?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Connection failed. Please try again.');
      } else {
        setSuccess(`Connected to "${data.accountName}"! Redirecting…`);
        setStatus({ connected: true, accountId, accountName: data.accountName ?? null });
        setToken('');
        setAccountId('');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/setup', { method: 'DELETE' });
      setStatus({ connected: false, accountId: null, accountName: null });
      setSuccess(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // ─── Already connected ─────────────────────────────────────────────────────
  if (status.connected) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
              Connected
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Ad account: <span className="font-medium text-[var(--text-primary)]">{status.accountName ?? `act_${status.accountId}`}</span>
              {status.accountId && (
                <span className="ml-2 text-xs text-[var(--text-dim)]">({status.accountId})</span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Your access token is stored securely and never exposed to the browser.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 transition-opacity"
          >
            Go to Dashboard →
          </button>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-red-600 hover:border-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Disconnect account
          </button>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--border-subtle)] p-4 text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-semibold text-[var(--text-primary)] text-sm">Want to connect a different account?</p>
          <p>Click "Disconnect account" above, then enter new credentials below.</p>
        </div>

        {/* Allow reconnecting while connected */}
        <ReconnectSection onConnect={(tok, acctId) => {
          setToken(tok);
          setAccountId(acctId);
        }} />
      </div>
    );
  }

  // ─── Not connected — show form ─────────────────────────────────────────────
  return (
    <form onSubmit={handleConnect} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-500/8 dark:border-red-500/20 p-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-500/8 dark:border-emerald-500/20 p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* Token field */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-[var(--text-primary)]">
          Meta Access Token
        </label>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="EAAxxxxxxxxxxxxxxx…"
            required
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] placeholder:text-[var(--text-dim)] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowToken(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Use a System User Token from Meta Business Manager for long-term access. User tokens expire after 60 days.
        </p>
      </div>

      {/* Account ID field */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-[var(--text-primary)]">
          Ad Account ID
        </label>
        <input
          type="text"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          placeholder="1234567890 or act_1234567890"
          required
          autoComplete="off"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] placeholder:text-[var(--text-dim)] transition-all"
        />
        <p className="text-xs text-[var(--text-muted)]">
          Found in Meta Business Manager → Accounts → Ad Accounts, or in the URL as <code className="px-1 py-0.5 rounded bg-[var(--border-subtle)] font-mono">act_XXXXXXXXXX</code>.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !token.trim() || !accountId.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Validating with Meta…
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Validate & Connect
          </>
        )}
      </button>
    </form>
  );
}

// ─── Reconnect panel (shown when already connected) ───────────────────────────

function ReconnectSection({ onConnect }: { onConnect: (t: string, a: string) => void }) {
  const [open, setOpen] = useState(false);
  const [token, setToken]     = useState('');
  const [accountId, setAccountId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--accent)] transition-colors"
      >
        Connect a different account
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, accountId }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; accountName?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Connection failed.');
      } else {
        setSuccess(`Switched to "${data.accountName}"! Redirecting…`);
        onConnect(token, accountId);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-[var(--border)] pt-4">
      <p className="text-sm font-semibold text-[var(--text-primary)]">Connect a different account</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
      <div className="relative">
        <input
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="New access token"
          required
          autoComplete="off"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2.5 pr-12 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] placeholder:text-[var(--text-dim)]"
        />
        <button type="button" onClick={() => setShowToken(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <input
        type="text"
        value={accountId}
        onChange={e => setAccountId(e.target.value)}
        placeholder="New ad account ID"
        required
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] placeholder:text-[var(--text-dim)]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--accent)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Connecting…' : 'Switch Account'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
