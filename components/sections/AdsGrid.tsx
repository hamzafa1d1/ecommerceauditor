'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fmt$, fmtPct } from '@/lib/formatters';
import { stageMeta } from '@/lib/fatigue';
import { useLang } from '@/components/providers/LangProvider';
import { ChevronUp, ChevronDown, ChevronsUpDown, X, AlertTriangle, Zap, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ad } from '@/lib/mock-data';

interface Props {
  data?: Ad[];
  isLoading?: boolean;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function rateColor(v: number, good: number, warn: number): string {
  if (v >= good) return '#10b981';
  if (v >= warn) return '#f59e0b';
  return '#ef4444';
}
const hookColor = (v: number) => rateColor(v, 0.35, 0.22);
const holdColor = (v: number) => rateColor(v, 0.35, 0.22);
const lpvColor  = (v: number) => rateColor(v, 0.75, 0.62);
const ctrColor  = (v: number) => rateColor(v / 100, 0.03, 0.015);

// ─── Rate cell with bar ───────────────────────────────────────────────────────

function RateCell({ value, colorFn, max = 0.6 }: {
  value: number | undefined;
  colorFn: (v: number) => string;
  max?: number;
}) {
  if (value == null || value === 0) {
    return <td className="px-3 py-2 text-center text-[var(--text-dim)] text-xs">—</td>;
  }
  const color = colorFn(value);
  const pct   = Math.min(100, (value / max) * 100);
  return (
    <td className="px-3 py-2">
      <div className="flex items-center gap-1.5 min-w-[72px]">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color }}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
    </td>
  );
}

// ─── CTR cell with bar ────────────────────────────────────────────────────────

function CtrCell({ value }: { value: number }) {
  const color = ctrColor(value);
  const pct   = Math.min(100, (value / 6) * 100);
  return (
    <td className="px-3 py-2">
      <div className="flex items-center gap-1.5 min-w-[60px]">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color }}>
          {fmtPct(value)}
        </span>
      </div>
    </td>
  );
}

// ─── Ranking badge ────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: 'above' | 'average' | 'below' | 'n/a' | undefined }) {
  if (!rank || rank === 'n/a') return <span className="text-[var(--text-dim)] text-[0.65rem]">—</span>;
  if (rank === 'above') return <span className="text-emerald-400 text-[0.7rem] font-bold">↑</span>;
  if (rank === 'below') return <span className="text-red-400 text-[0.7rem] font-bold">↓</span>;
  return <span className="text-[var(--text-muted)] text-[0.65rem]">~</span>;
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

type SortKey = 'spend' | 'conversions' | 'cpa' | 'hookRate' | 'holdRate' | 'lpvRate' | 'ctr';

function SortTh({ col, active, dir, onSort, children, subtitle }: {
  col: SortKey; active: SortKey; dir: 'asc' | 'desc';
  onSort: (k: SortKey) => void; children: React.ReactNode;
  subtitle?: string;
}) {
  const isActive = col === active;
  const Icon = isActive ? (dir === 'desc' ? ChevronDown : ChevronUp) : ChevronsUpDown;
  return (
    <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => onSort(col)}>
      <span className={cn(
        'flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider whitespace-nowrap',
        isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-slate-300',
      )}>
        {children}
        <Icon className="w-3 h-3 shrink-0" />
      </span>
      {subtitle && (
        <span className="block text-[0.55rem] normal-case tracking-normal font-normal text-[var(--text-dim)] mt-0.5 whitespace-nowrap">
          {subtitle}
        </span>
      )}
    </th>
  );
}

// ─── Summary tile ─────────────────────────────────────────────────────────────

function SummaryTile({ label, value, color, note }: {
  label: string; value: string; color: string; note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-[var(--border-subtle)] rounded-xl px-4 py-3">
      <span className="text-[0.6rem] uppercase tracking-wider font-semibold text-[var(--text-muted)]">{label}</span>
      <span className="text-xl font-bold tabular-nums" style={{ color }}>{value}</span>
      {note && <span className="text-[0.6rem] text-[var(--text-dim)] truncate">{note}</span>}
    </div>
  );
}

// ─── Mini funnel bars ─────────────────────────────────────────────────────────

function CreativeFunnel({ hook, hold, lpv }: { hook?: number; hold?: number; lpv?: number }) {
  const steps = [
    { value: hook, color: '#6366f1' },
    { value: hold, color: '#f59e0b' },
    { value: lpv,  color: '#10b981' },
  ];
  return (
    <div className="flex items-end gap-0.5 h-4 w-10">
      {steps.map((s, i) => {
        const pct = s.value != null && s.value > 0 ? Math.min(100, s.value * 100) : null;
        return (
          <div key={i} className="flex-1 rounded-sm" style={{
            height: `${pct != null ? Math.max(3, pct * 0.14) : 3}px`,
            background: pct != null ? s.color : 'var(--border)',
            opacity: pct != null ? 0.85 : 0.3,
            alignSelf: 'flex-end',
          }} />
        );
      })}
    </div>
  );
}

// ─── Filter helpers ──────────────────────────────────────────────────────────

function FilterPill({ active, activeColor, onClick, children }: {
  active: boolean; activeColor?: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-[0.65rem] font-semibold px-2 py-0.5 rounded-full transition-all whitespace-nowrap',
        active ? 'text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--border)]',
      )}
      style={active ? { background: activeColor ?? 'var(--accent)' } : undefined}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[0.6rem] text-[var(--text-dim)] uppercase tracking-wider font-semibold shrink-0 min-w-[36px] text-end">
        {label}
      </span>
      {children}
    </div>
  );
}

// ─── Per-ad next steps logic ─────────────────────────────────────────────────

type AdStep = { title: string; action: string; priority: 'critical' | 'warning' | 'info' | 'good' };

function getAdNextSteps(ad: Ad): AdStep[] {
  const steps: AdStep[] = [];

  if (ad.fatigueStage === 4)
    steps.push({ priority: 'critical', title: 'Stage 4 — Obvious Fatigue',
      action: 'Pause immediately. Every extra day in stage 4 compounds losses. Replace with a fresh creative.' });
  else if (ad.fatigueStage === 3)
    steps.push({ priority: 'warning', title: 'Stage 3 — Confirmed Fatigue',
      action: 'Prepare a replacement creative now. Duplicate the ad set before pausing to preserve algorithm learning.' });

  if ((ad.hookRate ?? 0) > 0 && ad.hookRate! < 0.22)
    steps.push({ priority: 'warning', title: `Weak Hook — ${(ad.hookRate! * 100).toFixed(0)}%`,
      action: 'Rework the first 3 seconds. Open with a bold question, unexpected visual, or strong statement to stop the scroll.' });

  if ((ad.holdRate ?? 0) > 0 && ad.holdRate! < 0.22)
    steps.push({ priority: 'warning', title: `Low Hold Rate — ${(ad.holdRate! * 100).toFixed(0)}%`,
      action: 'Viewers drop off quickly. Use faster cuts, on-screen text overlays, or deliver the value proposition earlier in the video.' });

  if ((ad.lpvRate ?? 0) > 0 && ad.lpvRate! < 0.62)
    steps.push({ priority: 'warning', title: `High LP Drop-off — ${(ad.lpvRate! * 100).toFixed(0)}% LPV rate`,
      action: 'Check page load speed (aim <3s on mobile), remove redirect chains, and reduce friction above the fold.' });

  if (ad.qualityRanking === 'below')
    steps.push({ priority: 'warning', title: 'Below Average Quality Ranking',
      action: 'Meta flags this creative as low quality vs. peers. Improve visual clarity, remove click-bait, and ensure the ad matches the landing page.' });

  if (ad.engagementRanking === 'below')
    steps.push({ priority: 'warning', title: 'Below Average Engagement Ranking',
      action: 'Post engagement is low vs. similar ads. Test a new creative angle, add social proof, or switch to a UGC format.' });

  if (ad.conversionRanking === 'below')
    steps.push({ priority: 'warning', title: 'Below Average Conversion Ranking',
      action: 'Post-click conversion rate is below peers. Align ad copy with the landing page offer and simplify the purchase path.' });

  if (ad.ctr < 1.5 && ad.impressions > 1000)
    steps.push({ priority: 'info', title: `Low CTR — ${ad.ctr.toFixed(2)}%`,
      action: 'CTR is below 1.5%. Test a new headline, stronger CTA, or a brighter contrasting thumbnail.' });

  if (steps.length === 0 && ad.status === 'ACTIVE' && (ad.hookRate ?? 0) >= 0.35 && ad.fatigueStage <= 2)
    steps.push({ priority: 'good', title: 'Strong Performer — Scale Opportunity',
      action: 'Hook and fatigue metrics are healthy. Duplicate the ad set and increase budget 20–30% every 48 h. Avoid doubling overnight.' });

  return steps;
}

const STEP_COLORS: Record<AdStep['priority'], { color: string; bg: string; label: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   label: 'Critical' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  label: 'Action'   },
  info:     { color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  label: 'Tip'      },
  good:     { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  label: 'Scale'    },
};

function AdNextStepsModal({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const steps = getAdNextSteps(ad);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 border-b border-[var(--border-subtle)]">
          <div className="min-w-0 pr-3">
            <p className="text-[0.6rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Next Steps</p>
            <p className="text-sm font-semibold text-slate-200 leading-snug" title={ad.name}
               style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ad.name}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 text-[var(--text-muted)] hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {steps.map((step, i) => {
            const cfg = STEP_COLORS[step.priority];
            return (
              <div key={i} className="rounded-xl p-3" style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.color}` }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[0.55rem] font-bold uppercase tracking-widest px-1.5 py-px rounded"
                    style={{ color: cfg.color, background: `${cfg.color}20` }}>
                    {cfg.label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>{step.title}</span>
                </div>
                <p className="text-[0.72rem] text-[var(--text-muted)] leading-relaxed">{step.action}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdsGrid({ data, isLoading }: Props) {
  const { t } = useLang();
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openAdId, setOpenAdId]         = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [stageFilter, setStageFilter]   = useState<'all' | number>('all');
  const [hookTier, setHookTier]         = useState<'all' | 'strong' | 'mid' | 'weak'>('all');

  const isFiltered = search.trim() !== '' || statusFilter !== 'all' || stageFilter !== 'all' || hookTier !== 'all';
  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setStageFilter('all'); setHookTier('all'); };

  // All hooks must be called before any early return
  const filtered = useMemo(() => {
    let result = data ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q));
    }
    if (statusFilter === 'active') result = result.filter(a => a.status === 'ACTIVE');
    if (statusFilter === 'paused') result = result.filter(a => a.status !== 'ACTIVE');
    if (stageFilter  !== 'all')    result = result.filter(a => a.fatigueStage === stageFilter);
    if (hookTier === 'strong')     result = result.filter(a => (a.hookRate ?? 0) >= 0.35);
    if (hookTier === 'mid')        result = result.filter(a => (a.hookRate ?? 0) >= 0.22 && (a.hookRate ?? 0) < 0.35);
    if (hookTier === 'weak')       result = result.filter(a => (a.hookRate ?? 0) > 0 && (a.hookRate ?? 0) < 0.22);
    return result;
  }, [data, search, statusFilter, stageFilter, hookTier]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const mul = sortDir === 'desc' ? -1 : 1;
    switch (sortKey) {
      case 'spend':       return mul * (a.spend       - b.spend);
      case 'conversions': return mul * (a.conversions - b.conversions);
      case 'cpa': {
        const ac = a.cpa || Infinity, bc = b.cpa || Infinity;
        return mul * (ac - bc);
      }
      case 'hookRate': return mul * ((a.hookRate ?? 0) - (b.hookRate ?? 0));
      case 'holdRate': return mul * ((a.holdRate ?? 0) - (b.holdRate ?? 0));
      case 'lpvRate':  return mul * ((a.lpvRate  ?? 0) - (b.lpvRate  ?? 0));
      case 'ctr':      return mul * (a.ctr - b.ctr);
      default: return 0;
    }
  }), [filtered, sortKey, sortDir]);

  // Summary stats (computed from all data, not filtered)
  const withCreative = useMemo(
    () => (data ?? []).filter(a => (a.hookRate ?? 0) > 0),
    [data],
  );
  const avg = (fn: (a: Ad) => number) =>
    withCreative.length ? withCreative.reduce((s, a) => s + fn(a), 0) / withCreative.length : 0;
  const avgHook = avg(a => a.hookRate ?? 0);
  const avgHold = avg(a => a.holdRate ?? 0);
  const avgLpv  = avg(a => a.lpvRate  ?? 0);
  const topHook = useMemo(
    () => [...withCreative].sort((a, b) => (b.hookRate ?? 0) - (a.hookRate ?? 0))[0],
    [withCreative],
  );
  // Detect the conversion event type from the dataset
  const convType = useMemo(() => {
    const types = [...new Set(
      (data ?? []).map(a => a.resultType).filter((v): v is string => Boolean(v))
    )];
    if (types.length === 1) return types[0];
    if (types.length > 1)  return 'Mixed';
    return null;
  }, [data]);
  const convTypeShort = convType ? convType.replace(/^Website /i, '') : null;
  const activeCount = useMemo(
    () => (data ?? []).filter(a => a.status === 'ACTIVE').length,
    [data],
  );
  if (isLoading || !data) {
    return (
      <section id="ads" className="scroll-mt-4">
        <Card>
          <CardHeader><CardTitle>{t.adsTitle}</CardTitle></CardHeader>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        </Card>
      </section>
    );
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <>    <section id="ads" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t.adsTitle}</CardTitle>
            <CardMuted>{t.adsSubtitle}</CardMuted>
          </div>
          <span className="text-xs tabular-nums shrink-0 text-[var(--text-dim)]">
            {filtered.length}<span className="opacity-50">/{data.length}</span>
          </span>
        </CardHeader>

        {/* Filter bar */}
        <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--border-subtle)] p-3 space-y-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-dim)] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ad name…"
              className="w-full ps-8 pe-8 py-1.5 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border)] text-slate-200 placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dimensional filter pills */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Status */}
            <FilterGroup label="Status">
              {([
                { key: 'all'    as const, label: 'All',    count: data.length              },
                { key: 'active' as const, label: 'Active', count: activeCount              },
                { key: 'paused' as const, label: 'Paused', count: data.length - activeCount },
              ]).map(({ key, label, count }) => (
                <FilterPill key={key} active={statusFilter === key} onClick={() => setStatusFilter(key)}>
                  {label} <span className="opacity-50">{count}</span>
                </FilterPill>
              ))}
            </FilterGroup>

            <div className="h-4 w-px bg-[var(--border)] shrink-0" />

            {/* Fatigue stage */}
            <FilterGroup label="Stage">
              {(['all', 1, 2, 3, 4] as const).map(s => {
                const meta       = s !== 'all' ? stageMeta(s) : null;
                const stageCount = s !== 'all' ? data.filter(a => a.fatigueStage === s).length : data.length;
                return (
                  <FilterPill
                    key={s}
                    active={stageFilter === s}
                    activeColor={meta?.color}
                    onClick={() => setStageFilter(s)}
                  >
                    {s === 'all' ? 'All' : `S${s}`}
                    <span className="opacity-50 ms-0.5">{stageCount}</span>
                  </FilterPill>
                );
              })}
            </FilterGroup>

            <div className="h-4 w-px bg-[var(--border)] shrink-0" />

            {/* Hook tier */}
            <FilterGroup label="Hook">
              {([
                { key: 'all'    as const, label: 'All',    color: undefined  },
                { key: 'strong' as const, label: '≥ 35%',   color: '#10b981'  },
                { key: 'mid'    as const, label: '22–35%', color: '#f59e0b'  },
                { key: 'weak'   as const, label: '< 22%',   color: '#ef4444'  },
              ]).map(({ key, label, color }) => (
                <FilterPill key={key} active={hookTier === key} activeColor={color} onClick={() => setHookTier(key)}>
                  {label}
                </FilterPill>
              ))}
            </FilterGroup>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="ms-auto flex items-center gap-1 text-[0.65rem] text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Summary tiles */}
        {withCreative.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <SummaryTile
              label={t.adsAvgHook}
              value={`${(avgHook * 100).toFixed(0)}%`}
              color={hookColor(avgHook)}
              note={avgHook >= 0.35 ? '↑ Strong hook' : avgHook >= 0.22 ? 'Acceptable' : '↓ Needs work'}
            />
            <SummaryTile
              label={t.adsAvgHold}
              value={`${(avgHold * 100).toFixed(0)}%`}
              color={holdColor(avgHold)}
              note={avgHold >= 0.35 ? '↑ Engaging content' : avgHold >= 0.22 ? 'Acceptable' : '↓ Content loses viewers'}
            />
            <SummaryTile
              label={t.adsAvgLpv}
              value={`${(avgLpv * 100).toFixed(0)}%`}
              color={lpvColor(avgLpv)}
              note={avgLpv >= 0.75 ? '↑ Clean traffic' : avgLpv >= 0.62 ? 'Watch LP load speed' : '↓ LP friction issue'}
            />
            {topHook && (
              <SummaryTile
                label={t.adsBestHook}
                value={`${((topHook.hookRate ?? 0) * 100).toFixed(0)}%`}
                color="#6366f1"
                note={topHook.name.length > 24 ? topHook.name.slice(0, 23) + '…' : topHook.name}
              />
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full border-collapse" style={{ minWidth: 780 }}>
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-left">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Ad</span>
                </th>
                <SortTh col="spend"       active={sortKey} dir={sortDir} onSort={handleSort}>{t.adsSpend}</SortTh>
                <SortTh col="conversions" active={sortKey} dir={sortDir} onSort={handleSort}
                  subtitle={convTypeShort ?? undefined}>{t.adsConv}</SortTh>
                <SortTh col="cpa"         active={sortKey} dir={sortDir} onSort={handleSort}
                  subtitle={convTypeShort ? `Per ${convTypeShort.toLowerCase()}` : undefined}>{t.adsCpa}</SortTh>
                <SortTh col="hookRate"    active={sortKey} dir={sortDir} onSort={handleSort}>{t.adsHookRate}</SortTh>
                <SortTh col="holdRate"    active={sortKey} dir={sortDir} onSort={handleSort}>{t.adsHoldRate}</SortTh>
                <SortTh col="lpvRate"     active={sortKey} dir={sortDir} onSort={handleSort}>{t.adsLpvRate}</SortTh>
                <SortTh col="ctr"         active={sortKey} dir={sortDir} onSort={handleSort}>{t.adsCtr}</SortTh>
                <th className="px-3 py-2 text-center">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Q · E · C</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <p className="text-[var(--text-muted)] text-sm mb-2">No ads match your filters</p>
                    {isFiltered && (
                      <button onClick={clearFilters} className="text-[0.72rem] text-[var(--accent)] hover:underline">
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : sorted.map((ad, i) => {
                const meta     = stageMeta(ad.fatigueStage);
                const isActive = ad.status === 'ACTIVE';
                const hasRanks = (ad.qualityRanking    && ad.qualityRanking    !== 'n/a')
                               || (ad.engagementRanking && ad.engagementRanking !== 'n/a')
                               || (ad.conversionRanking && ad.conversionRanking !== 'n/a');
                const adSteps  = getAdNextSteps(ad);
                const topStep  = adSteps[0];
                return (
                  <tr
                    key={ad.id}
                    className={cn(
                      'border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-card-hover)]',
                      i % 2 !== 0 && 'bg-[var(--border-subtle)]/20',
                    )}
                  >
                    {/* Ad name */}
                    <td className="px-3 py-2 max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                          style={{ background: isActive ? '#10b981' : '#475569' }}
                          title={isActive ? 'Active' : 'Paused'}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-slate-200 truncate" title={ad.name} style={{ maxWidth: 155 }}>
                              {ad.name}
                            </p>
                            {adSteps.length > 0 && (
                              <button
                                onClick={() => setOpenAdId(ad.id)}
                                title="View next steps"
                                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center hover:scale-125 transition-transform"
                                style={{
                                  background: STEP_COLORS[topStep.priority].bg,
                                  color:      STEP_COLORS[topStep.priority].color,
                                }}
                              >
                                {topStep.priority === 'good'
                                  ? <Zap className="w-2.5 h-2.5" />
                                  : <AlertTriangle className="w-2.5 h-2.5" />}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[0.5rem] font-bold px-1 py-px rounded"
                              style={{ color: meta.color, background: `${meta.color}18` }}
                            >
                              S{ad.fatigueStage} · {meta.label}
                            </span>
                            <CreativeFunnel hook={ad.hookRate} hold={ad.holdRate} lpv={ad.lpvRate} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Spend */}
                    <td className="px-3 py-2 text-xs font-semibold text-slate-300 tabular-nums whitespace-nowrap">
                      {fmt$(ad.spend)}
                    </td>

                    {/* Conversions */}
                    <td className="px-3 py-2 text-xs text-slate-300 tabular-nums" title={ad.resultType ?? convType ?? undefined}>
                      {ad.conversions > 0 ? ad.conversions.toLocaleString() : <span className="text-[var(--text-dim)]">—</span>}
                    </td>

                    {/* CPA */}
                    <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" title={ad.resultType ? `Cost per ${ad.resultType.toLowerCase()}` : undefined}>
                      {ad.cpa > 0
                        ? <span className={ad.cpa < 3 ? 'text-emerald-400 font-semibold' : ad.cpa < 6 ? 'text-amber-400' : 'text-red-400'}>
                            {fmt$(ad.cpa)}
                          </span>
                        : <span className="text-[var(--text-dim)]">—</span>
                      }
                    </td>

                    {/* Hook Rate */}
                    <RateCell value={ad.hookRate} colorFn={hookColor} max={0.55} />
                    {/* Hold Rate */}
                    <RateCell value={ad.holdRate} colorFn={holdColor} max={0.55} />
                    {/* LPV Rate */}
                    <RateCell value={ad.lpvRate}  colorFn={lpvColor}  max={1.0}  />
                    {/* CTR */}
                    <CtrCell value={ad.ctr} />

                    {/* Rankings Q · E · C */}
                    <td className="px-3 py-2">
                      {hasRanks ? (
                        <div className="flex items-center justify-center gap-2">
                          <span title={`Quality: ${ad.qualityRanking}`}><RankBadge rank={ad.qualityRanking} /></span>
                          <span className="text-[var(--border-subtle)] text-[0.6rem]">·</span>
                          <span title={`Engagement: ${ad.engagementRanking}`}><RankBadge rank={ad.engagementRanking} /></span>
                          <span className="text-[var(--border-subtle)] text-[0.6rem]">·</span>
                          <span title={`Conversion: ${ad.conversionRanking}`}><RankBadge rank={ad.conversionRanking} /></span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-dim)] text-xs block text-center">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-4 gap-y-1 text-[0.6rem] text-[var(--text-dim)]">
          <span><span className="text-emerald-400 font-bold">↑</span> {t.adsAboveAvg}</span>
          <span><span className="text-[var(--text-muted)]">~</span> {t.adsAverage}</span>
          <span><span className="text-red-400 font-bold">↓</span> {t.adsBelowAvg}</span>
          <span className="ms-auto opacity-70">Q = {t.adsQuality} · E = {t.adsEngmt} · C = {t.adsConvRank}</span>
        </div>
      </Card>
    </section>
    {openAdId && (() => {
      const openAd = (data ?? []).find(a => a.id === openAdId);
      return openAd ? <AdNextStepsModal ad={openAd} onClose={() => setOpenAdId(null)} /> : null;
    })()}
    </>
  );
}
