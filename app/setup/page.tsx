import { cookies } from 'next/headers';
import { Zap, ShieldCheck, Key, Building2 } from 'lucide-react';
import { ConnectForm } from '@/components/setup/ConnectForm';

export const metadata = {
  title: 'Connect Ad Account — Meta Pulse',
};

async function getConnectionStatus() {
  const jar = await cookies();
  return {
    connected:   !!jar.get('meta_token')?.value,
    accountId:   jar.get('meta_account_id')?.value   ?? null,
    accountName: jar.get('meta_account_name')?.value ?? null,
  };
}

export default async function SetupPage() {
  const status = await getConnectionStatus();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-start justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-xl space-y-8">

        {/* Branding header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest">Meta Pulse</p>
            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
              Connect your Ad Account
            </h1>
          </div>
        </div>

        {/* Main card */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {status.connected ? 'Account connected' : 'Enter your credentials'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {status.connected
                ? 'Your access token is stored server-side only. You can disconnect at any time.'
                : 'Your credentials are validated in real-time and stored in a secure http-only cookie — never in the browser.'}
            </p>
          </div>

          <ConnectForm initialStatus={status} />
        </div>

        {/* How to get credentials */}
        {!status.connected && (
          <div className="card p-6 space-y-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              How to get your credentials
            </h3>

            <div className="space-y-4">
              <Step
                icon={Building2}
                step="1"
                title="Open Meta Business Manager"
                desc={
                  <>
                    Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline underline-offset-2">business.facebook.com → Settings → System Users</a>. Create a new System User (Employee role). Assign your ad account to it.
                  </>
                }
              />
              <Step
                icon={Key}
                step="2"
                title="Generate a System User Token"
                desc='In the System User page, click "Generate New Token". Select your app and add these permissions: ads_read, read_insights. Copy the token.'
              />
              <Step
                icon={ShieldCheck}
                step="3"
                title="Find your Ad Account ID"
                desc={
                  <>
                    In Business Manager → Accounts → Ad Accounts, your account ID is shown as <code className="px-1 py-0.5 rounded text-xs font-mono bg-[var(--border-subtle)]">act_XXXXXXXXXX</code>. You can enter it with or without the <code className="px-1 py-0.5 rounded text-xs font-mono bg-[var(--border-subtle)]">act_</code> prefix.
                  </>
                }
              />
            </div>

            <div className="rounded-xl bg-[var(--border-subtle)] border border-[var(--border)] p-4 text-xs text-[var(--text-muted)]">
              <p className="font-semibold text-[var(--text-primary)] mb-1">System User Token vs User Token</p>
              <p>
                A <strong>System User Token</strong> never expires (recommended for production use).
                A <strong>User Access Token</strong> from the Meta Graph API Explorer expires after 60 days.
                Both work — use System User for any deployment meant to run longer than 60 days.
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 p-4 text-xs">
              <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Meta App must be in Live mode</p>
              <p className="text-amber-700 dark:text-amber-400">
                In the Meta Developer portal, your app must be set to <strong>Live</strong> for tokens not on the tester list to work. In <strong>Development</strong> mode, only app admins and testers can generate valid tokens.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[var(--text-dim)]">
          Meta Pulse • Ads Intelligence Dashboard
        </p>
      </div>
    </div>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Step({
  icon: Icon, step, title, desc,
}: {
  icon: React.FC<{ className?: string }>;
  step: string;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
        <span className="text-xs font-bold text-[var(--accent)]">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
