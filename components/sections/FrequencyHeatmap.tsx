'use client';

import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { stageMeta } from '@/lib/fatigue';
import { useLang } from '@/components/providers/LangProvider';

interface HeatmapRow {
  adId:   string;
  adName: string;
  stage:  1 | 2 | 3 | 4;
  values: { date: string; frequency: number }[];
}

interface Props {
  data?: HeatmapRow[];
  isLoading?: boolean;
}

function freqColor(freq: number): string {
  if (freq < 1.5) return '#10b98120';
  if (freq < 2.0) return '#10b98150';
  if (freq < 2.5) return '#f59e0b50';
  if (freq < 3.0) return '#f59e0b90';
  if (freq < 4.0) return '#f9731690';
  if (freq < 5.0) return '#ef444480';
  return '#ef4444cc';
}

function freqTextColor(freq: number): string {
  if (freq < 2.0) return '#64748b';
  if (freq < 3.5) return '#e2e8f0';
  return '#ffffff';
}

export function FrequencyHeatmap({ data, isLoading }: Props) {
  const { t } = useLang();
  if (isLoading || !data) {
    return (
      <section id="heatmap" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t.heatmapTitle}</CardTitle>
          </CardHeader>
          <Skeleton className="h-64" />
        </Card>
      </section>
    );
  }

  const dates = data[0]?.values.map(v => v.date) ?? [];

  return (
    <section id="heatmap" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.heatmapTitle}</CardTitle>
            <CardMuted>
              {t.heatmapSubtitle}
            </CardMuted>
          </div>
          <div className="flex items-center gap-2 text-[0.6rem] text-[var(--text-muted)]">
            <span>Low</span>
            <div className="flex gap-0.5">
              {['#10b98130','#f59e0b50','#f9731690','#ef444490','#ef4444cc'].map(c => (
                <div key={c} className="w-4 h-3 rounded-sm" style={{ background: c }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="text-left pb-2 pr-3 text-[0.6rem] text-[var(--text-muted)] font-medium w-40">Ad</th>
                {dates.map(d => (
                  <th key={d} className="pb-2 px-0.5 text-center text-[0.55rem] text-[var(--text-dim)] font-normal whitespace-nowrap" style={{ minWidth: 30 }}>
                    {format(parseISO(d), 'M/d')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(row => {
                const meta = stageMeta(row.stage);
                return (
                  <tr key={row.adId}>
                    <td className="pr-3 py-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                        <span className="text-[0.6rem] text-[var(--text-muted)] truncate" style={{ maxWidth: 140 }}>
                          {row.adName}
                        </span>
                      </div>
                    </td>
                    {row.values.map(v => (
                      <td key={v.date} className="px-0.5 py-0.5">
                        <div
                          className="rounded-sm flex items-center justify-center text-[0.5rem] font-medium transition-all"
                          style={{
                            background:   freqColor(v.frequency),
                            color:        freqTextColor(v.frequency),
                            height:       22,
                            minWidth:     26,
                          }}
                          title={`${row.adName} · ${format(parseISO(v.date), 'MMM d')} · freq ${v.frequency}`}
                        >
                          {v.frequency.toFixed(1)}
                        </div>
                      </td>
                    ))}
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
