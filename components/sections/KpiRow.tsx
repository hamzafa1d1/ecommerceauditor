'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fmt$, fmtPct, fmtNum, fmtROAS, fmtFreq } from '@/lib/formatters';
import { useLang } from '@/components/providers/LangProvider';
import type { MOCK_KPI_CURRENT } from '@/lib/mock-data';

type KpiData = typeof MOCK_KPI_CURRENT;

interface KpiRowProps {
  current?: KpiData;
  prev?: KpiData;
  isLoading?: boolean;
}

function delta(curr: number, prev: number) {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

interface KpiDef {
  key: keyof KpiData;
  label: string;
  format: (v: number) => string;
  inverse?: boolean;   // true = lower is better (CPC, CPA, CPM, Frequency)
  accentColor: string;
}

export function KpiRow({ current, prev, isLoading }: KpiRowProps) {
  const { t } = useLang();

  const KPIS: KpiDef[] = [
    { key: 'spend',     label: t.kpiSpend, format: fmt$,                       inverse: true,  accentColor: '#6366f1' },
    { key: 'roas',      label: t.kpiRoas,  format: fmtROAS,                    inverse: false, accentColor: '#10b981' },
    { key: 'cpm',       label: t.kpiCpm,   format: fmt$,                       inverse: true,  accentColor: '#f59e0b' },
    { key: 'ctr',       label: t.kpiCtr,   format: v => fmtPct(v),             inverse: false, accentColor: '#60a5fa' },
    { key: 'cpc',       label: t.kpiCpc,   format: fmt$,                       inverse: true,  accentColor: '#a78bfa' },
    { key: 'cpa',       label: t.kpiCpa,   format: fmt$,                       inverse: true,  accentColor: '#fb923c' },
    { key: 'reach',     label: t.kpiReach, format: fmtNum,                     inverse: false, accentColor: '#38bdf8' },
    { key: 'frequency', label: t.kpiFreq,  format: fmtFreq,                    inverse: true,  accentColor: '#f97316' },
  ];

  if (isLoading || !current || !prev) {
    return (
      <section id="kpis" className="scroll-mt-4">
          <p className="section-title mb-3">{t.kpiOverview}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {KPIS.map(k => (
            <Skeleton key={k.key} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="kpis" className="scroll-mt-4">
      <p className="section-title mb-3">Performance Overview</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {KPIS.map(kpi => {
          const curr = current[kpi.key];
          const pv   = prev[kpi.key];
          const d    = delta(curr, pv);
          const good = kpi.inverse ? d <= 0 : d >= 0;
          const neutral = Math.abs(d) < 0.5;

          return (
            <Card key={kpi.key} className="flex flex-col gap-1.5 px-4 py-3">
              <p className="text-[0.6875rem] font-medium text-[var(--text-muted)] truncate">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-100 leading-none" style={{ color: kpi.accentColor }}>
                {kpi.format(curr)}
              </p>
              <div className="flex items-center gap-1">
                {neutral ? (
                  <Minus className="w-3 h-3 text-[var(--text-muted)]" />
                ) : good ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className={`text-[0.6875rem] font-semibold ${neutral ? 'text-[var(--text-muted)]' : good ? 'text-emerald-400' : 'text-red-400'}`}>
                  {d >= 0 ? '+' : ''}{d.toFixed(1)}%
                </span>
                    <span className="text-[0.6rem] text-[var(--text-dim)]">{t.vsPrev}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
