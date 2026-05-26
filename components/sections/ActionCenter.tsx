'use client';

import { useState } from 'react';
import {
  AlertTriangle, TrendingUp, RefreshCw, Eye,
  ArrowRight, Zap, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { fmtROAS, fmtFreq, fmtPct, fmt$ } from '@/lib/formatters';
import type { ActionItem, ActionVerb, ActionPriority } from '@/lib/actions-engine';

interface Props {
  actions: ActionItem[];
  onActionClick: (id: string, type: 'campaign' | 'ad') => void;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const VERB_CONFIG: Record<ActionVerb, { bg: string; label: string; Icon: React.FC<{ className?: string }> }> = {
  Pause:   { bg: '#dc2626', label: 'PAUSE',   Icon: AlertTriangle },
  Scale:   { bg: '#059669', label: 'SCALE',   Icon: TrendingUp    },
  Refresh: { bg: '#ea580c', label: 'REFRESH', Icon: RefreshCw     },
  Review:  { bg: '#7c3aed', label: 'REVIEW',  Icon: Eye           },
};

const PRIORITY_STYLE: Record<ActionPriority, { bar: string; bg: string; border: string }> = {
  critical:    { bar: '#dc2626', bg: 'rgba(220,38,38,0.06)',   border: 'rgba(220,38,38,0.2)'  },
  warning:     { bar: '#ea580c', bg: 'rgba(234,88,12,0.06)',   border: 'rgba(234,88,12,0.2)'  },
  opportunity: { bar: '#059669', bg: 'rgba(5,150,105,0.06)',   border: 'rgba(5,150,105,0.2)'  },
};

const GROUP_META: Record<ActionPriority, { label: string; Icon: React.FC<{ className?: string }> }> = {
  critical:    { label: 'Urgent Actions', Icon: AlertTriangle },
  warning:     { label: 'Warnings',       Icon: RefreshCw     },
  opportunity: { label: 'Opportunities',  Icon: TrendingUp    },
};

// ─── Metric chip ──────────────────────────────────────────────────────────────

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--border-subtle)] text-[var(--text-muted)] tabular-nums whitespace-nowrap border border-[var(--border)]">
      <span className="font-medium">{label}</span> {value}
    </span>
  );
}

// ─── Single action card ───────────────────────────────────────────────────────

function ActionCard({ action, onView }: { action: ActionItem; onView: () => void }) {
  const ps = PRIORITY_STYLE[action.priority];
  const vc = VERB_CONFIG[action.verb];
  const { Icon } = vc;

  return (
    <div
      className="relative rounded-xl overflow-hidden flex flex-col"
      style={{ background: ps.bg, border: `1px solid ${ps.border}` }}
    >
      {/* Left priority stripe */}
      <div className="absolute left-0 inset-y-0 w-[3px] rounded-l-xl" style={{ background: ps.bar }} />

      <div className="pl-5 pr-4 pt-4 pb-4 flex flex-col gap-3 flex-1">
        {/* Verb badge + name row */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="shrink-0 inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
              style={{ background: `${vc.bg}15`, color: vc.bg, border: `1px solid ${vc.bg}25` }}
            >
              <Icon className="w-3 h-3" />
              {vc.label}
            </span>
            <span
              className="text-sm font-semibold truncate text-[var(--text-primary)]"
              title={action.affectedName}
            >
              {action.affectedName}
            </span>
          </div>
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-dim)] border border-[var(--border)] capitalize">
            {action.affectedType}
          </span>
        </div>

        {/* Reason */}
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{action.reason}</p>

        {/* Metric chips */}
        <div className="flex flex-wrap gap-1.5">
          {action.metrics.roas      !== undefined && <MetricChip label="ROAS"  value={fmtROAS(action.metrics.roas)} />}
          {action.metrics.frequency !== undefined && <MetricChip label="Freq"  value={fmtFreq(action.metrics.frequency)} />}
          {action.metrics.ctr       !== undefined && <MetricChip label="CTR"   value={fmtPct(action.metrics.ctr)} />}
          {action.metrics.cpa       !== undefined && <MetricChip label="CPA"   value={fmt$(action.metrics.cpa)} />}
          {action.metrics.spend     !== undefined && <MetricChip label="Spend" value={fmt$(action.metrics.spend)} />}
          {action.metrics.stage     !== undefined && <MetricChip label="Stage" value={String(action.metrics.stage)} />}
        </div>

        {/* View button */}
        <button
          onClick={onView}
          className="self-start mt-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75 active:scale-95"
          style={{ background: `${ps.bar}12`, color: ps.bar, border: `1px solid ${ps.bar}25` }}
        >
          View metrics
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Action group (collapsible section) ──────────────────────────────────────

function ActionGroup({
  priority, actions, onActionClick, defaultOpen = true,
}: {
  priority: ActionPriority;
  actions: ActionItem[];
  onActionClick: (id: string, type: 'campaign' | 'ad') => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (actions.length === 0) return null;

  const ps   = PRIORITY_STYLE[priority];
  const meta = GROUP_META[priority];
  const { Icon } = meta;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 py-1 group"
        type="button"
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ps.bar }} />
        <span style={{ color: ps.bar }} className="shrink-0 flex items-center">
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-sm font-bold" style={{ color: ps.bar }}>
          {meta.label}
        </span>
        <span
          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${ps.bar}15`, color: ps.bar, border: `1px solid ${ps.bar}30` }}
        >
          {actions.length}
        </span>
        <div className="flex-1 h-px" style={{ background: `${ps.bar}20` }} />
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform duration-200"
          style={{ color: ps.bar, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Cards grid */}
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {actions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              onView={() => onActionClick(action.affectedId, action.affectedType)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActionCenter({ actions, onActionClick }: Props) {
  const criticals     = actions.filter(a => a.priority === 'critical');
  const warnings      = actions.filter(a => a.priority === 'warning');
  const opportunities = actions.filter(a => a.priority === 'opportunity');

  if (actions.length === 0) {
    return (
      <section id="action-center" className="scroll-mt-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-center gap-4">
          <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
              All campaigns healthy
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              No urgent actions detected. Prepare your next creative batch proactively — the best media buyers launch fresh ads before fatigue arrives.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="action-center" className="scroll-mt-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">
              Action Center
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Priority decisions to optimize your campaigns today
            </p>
          </div>
        </div>

        {/* Summary counts */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-0.5">
          {criticals.length > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 dark:text-red-400">
              {criticals.length} urgent
            </span>
          )}
          {warnings.length > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 dark:text-orange-400">
              {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
            </span>
          )}
          {opportunities.length > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400">
              {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}
            </span>
          )}
        </div>
      </div>

      {/* Grouped sections */}
      <div className="space-y-6">
        <ActionGroup
          priority="critical"
          actions={criticals}
          onActionClick={onActionClick}
          defaultOpen
        />
        <ActionGroup
          priority="warning"
          actions={warnings}
          onActionClick={onActionClick}
          defaultOpen
        />
        <ActionGroup
          priority="opportunity"
          actions={opportunities}
          onActionClick={onActionClick}
          defaultOpen={criticals.length === 0 && warnings.length === 0}
        />
      </div>
    </section>
  );
}
