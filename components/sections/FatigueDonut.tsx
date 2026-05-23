'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { stageMeta } from '@/lib/fatigue';
import type { Ad } from '@/lib/mock-data';
import { useLang } from '@/components/providers/LangProvider';

interface Props {
  ads?: Ad[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-slate-200">{d.name}</p>
      <p className="text-xs text-[var(--text-muted)]">{d.value} ads <span className="text-slate-300 font-medium">({d.payload.pct}%)</span></p>
    </div>
  );
};

export function FatigueDonut({ ads, isLoading }: Props) {
  const { t } = useLang();
  if (isLoading || !ads) {
    return (
      <section id="donut" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.donutTitle}</CardTitle>
              <CardMuted>{t.donutSubtitle}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={240} />
        </Card>
      </section>
    );
  }

  const total = ads.length;
  const pieData = ([1,2,3,4] as const).map(s => {
    const count = ads.filter(a => a.fatigueStage === s).length;
    const meta  = stageMeta(s);
    return {
      name:  meta.label,
      value: count,
      color: meta.color,
      pct:   total > 0 ? ((count / total) * 100).toFixed(0) : '0',
    };
  }).filter(d => d.value > 0);

  // Health assessment
  const stage4Pct = (ads.filter(a => a.fatigueStage === 4).length / total) * 100;
  const stage3Pct = (ads.filter(a => a.fatigueStage === 3).length / total) * 100;
  const healthLabel = stage4Pct > 30
    ? { text: t.donutCritical, color: '#ef4444' }
    : stage3Pct + stage4Pct > 50 ? { text: t.donutWarning, color: '#f97316' }
    : stage3Pct + stage4Pct > 25 ? { text: t.donutWarning, color: '#f59e0b' }
    : { text: t.donutHealthy, color: '#10b981' };

  return (
    <section id="donut" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.donutTitle}</CardTitle>
            <CardMuted>How many of your {total} active ads are in each fatigue stage</CardMuted>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold" style={{ color: healthLabel.color }}>{healthLabel.text}</p>
          </div>
        </CardHeader>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2">
            {([1,2,3,4] as const).map(s => {
              const count = ads.filter(a => a.fatigueStage === s).length;
              const meta  = stageMeta(s);
              const pct   = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={s}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: meta.color }}>
                      Stage {s} · {meta.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{count} ads ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: meta.color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
