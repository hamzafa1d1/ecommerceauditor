'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { Badge, FatigueBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fmt$, fmtPct, fmtNum, fmtROAS, fmtFreq } from '@/lib/formatters';
import { useLang } from '@/components/providers/LangProvider';
import type { Campaign } from '@/lib/mock-data';

interface Props {
  data?: Campaign[];
  isLoading?: boolean;
  highlightedId?: string | null;
}

type SortKey = 'name' | 'spend' | 'roas' | 'ctr' | 'cpc' | 'cpa' | 'cpm' | 'frequency' | 'fatigueScore';

export function CampaignTable({ data, isLoading, highlightedId }: Props) {
  const { t } = useLang();
  const [sortKey, setSortKey] = useState<SortKey>('fatigueScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Scroll highlighted row into view when highlightedId changes
  useEffect(() => {
    if (!highlightedId) return;
    const el = rowRefs.current.get(highlightedId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedId]);

  const COLS: { key: SortKey; label: string; format?: (c: Campaign) => string; right?: boolean }[] = [
    { key: 'name',         label: t.colCampaign },
    { key: 'spend',        label: t.colSpend,  format: c => fmt$(c.spend),         right: true },
    { key: 'roas',         label: t.colRoas,   format: c => fmtROAS(c.roas),       right: true },
    { key: 'ctr',          label: t.colCtr,    format: c => fmtPct(c.ctr),         right: true },
    { key: 'cpc',          label: t.colCpc,    format: c => fmt$(c.cpc),           right: true },
    { key: 'cpa',          label: t.colCpa,    format: c => fmt$(c.cpa),           right: true },
    { key: 'cpm',          label: t.colCpm,    format: c => fmt$(c.cpm),           right: true },
    { key: 'frequency',    label: t.colFreq,   format: c => fmtFreq(c.frequency),  right: true },
    { key: 'fatigueScore', label: t.colStage,                                       right: false },
  ];

  if (isLoading || !data) {
    return (
      <section id="campaigns" className="scroll-mt-4">
        <Card>
          <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </Card>
      </section>
    );
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <section id="campaigns" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t.campaignPerf}</CardTitle>
            <CardMuted>{t.campaignHint}</CardMuted>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>{t.totalSpend}: <strong className="text-slate-200">{fmt$(data.reduce((s, c) => s + c.spend, 0))}</strong></span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {COLS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wide cursor-pointer hover:text-slate-300 select-none whitespace-nowrap ${col.right ? 'text-right' : 'text-left'}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const isHighlighted = highlightedId === c.id;
                return (
                <tr
                  key={c.id}
                  ref={el => {
                    if (el) rowRefs.current.set(c.id, el);
                    else rowRefs.current.delete(c.id);
                  }}
                  className={`border-b border-[var(--border-subtle)] transition-colors ${
                    isHighlighted
                      ? 'bg-[var(--accent)]/10 outline outline-1 outline-[var(--accent)]/40'
                      : 'hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-medium text-sm">{c.name}</span>
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">
                        {c.objective} · <Badge variant={c.status === 'ACTIVE' ? 'active' : 'paused'}>{c.status}</Badge>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs">{fmt$(c.spend)}</td>
                  <td className={`py-3 px-3 text-right font-mono text-xs font-semibold ${c.roas >= 3 ? 'text-emerald-400' : c.roas >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fmtROAS(c.roas)}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono text-xs ${c.ctr >= 1.5 ? 'text-emerald-400' : c.ctr >= 0.8 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fmtPct(c.ctr)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs">{fmt$(c.cpc)}</td>
                  <td className="py-3 px-3 text-right font-mono text-xs">{fmt$(c.cpa)}</td>
                  <td className="py-3 px-3 text-right font-mono text-xs">{fmt$(c.cpm)}</td>
                  <td className={`py-3 px-3 text-right font-mono text-xs font-semibold ${c.frequency < 2 ? 'text-emerald-400' : c.frequency < 3.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {fmtFreq(c.frequency)}
                  </td>
                  <td className="py-3 px-3">
                    <FatigueBadge stage={c.fatigueStage} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
