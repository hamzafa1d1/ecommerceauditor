'use client';

import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { fmt$, fmtROAS } from '@/lib/formatters';
import type { Campaign } from '@/lib/mock-data';
import { stageMeta } from '@/lib/fatigue';
import { useLang } from '@/components/providers/LangProvider';

interface Props {
  data?: Campaign[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-slate-200 mb-2">{d.name}</p>
      <div className="space-y-1 text-xs">
        <div className="flex gap-2"><span className="text-[var(--text-muted)]">Spend:</span><span>{fmt$(d.spend)}</span></div>
        <div className="flex gap-2"><span className="text-[var(--text-muted)]">ROAS:</span><span className={d.roas >= 3 ? 'text-emerald-400' : 'text-red-400'}>{fmtROAS(d.roas)}</span></div>
        <div className="flex gap-2"><span className="text-[var(--text-muted)]">Conversions:</span><span>{d.conversions}</span></div>
        <div className="flex gap-2"><span className="text-[var(--text-muted)]">Stage:</span><span style={{ color: stageMeta(d.fatigueStage).color }}>{stageMeta(d.fatigueStage).label}</span></div>
      </div>
    </div>
  );
};

export function BubbleChart({ data, isLoading }: Props) {
  const { t } = useLang();

  const BubbleTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="chart-tooltip">
        <p className="font-semibold text-slate-200 mb-2">{d.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex gap-2"><span className="text-[var(--text-muted)]">{t.colSpend}:</span><span>{fmt$(d.spend)}</span></div>
          <div className="flex gap-2"><span className="text-[var(--text-muted)]">{t.colRoas}:</span><span className={d.roas >= 3 ? 'text-emerald-400' : 'text-red-400'}>{fmtROAS(d.roas)}</span></div>
          <div className="flex gap-2"><span className="text-[var(--text-muted)]">{t.adsConv}:</span><span>{d.conversions}</span></div>
          <div className="flex gap-2"><span className="text-[var(--text-muted)]">{t.colStage}:</span><span style={{ color: stageMeta(d.fatigueStage).color }}>{stageMeta(d.fatigueStage).label}</span></div>
        </div>
      </div>
    );
  };
  if (isLoading || !data) {
    return (
      <section id="bubble" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.bubbleTitle}</CardTitle>
              <CardMuted>{t.bubbleSubtitle}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={280} />
        </Card>
      </section>
    );
  }

  const chartData = data.map(c => ({
    name:         c.name,
    spend:        c.spend,
    roas:         c.roas,
    conversions:  c.conversions,
    fatigueStage: c.fatigueStage,
  }));

  return (
    <section id="bubble" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.bubbleTitle}</CardTitle>
            <CardMuted>
              X = {t.colSpend} · Y = {t.colRoas} · {t.bubbleSubtitle}
            </CardMuted>
          </div>
          <div className="flex gap-3 text-[0.6875rem]">
            {([1,2,3,4] as const).map(s => {
              const m = stageMeta(s);
              return (
                <span key={s} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                  <span className="text-[var(--text-muted)]">S{s}</span>
                </span>
              );
            })}
          </div>
        </CardHeader>

        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" />
            <XAxis
              type="number"
              dataKey="spend"
              name="Spend"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
              label={{ value: 'Spend →', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#475569' }}
            />
            <YAxis
              type="number"
              dataKey="roas"
              name="ROAS"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}x`}
              width={36}
              label={{ value: 'ROAS ↑', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#475569' }}
            />
            <ZAxis type="number" dataKey="conversions" range={[400, 2400]} />
            <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#1e2d40' }} />
            <Scatter data={chartData} fillOpacity={0.75}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={stageMeta(entry.fatigueStage).color}
                  stroke={stageMeta(entry.fatigueStage).color}
                  strokeOpacity={0.4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant labels */}
        <div className="mt-1 grid grid-cols-2 gap-2 text-[0.6rem] text-[var(--text-dim)] px-8">
          <div className="text-right">↙ Low Spend, Low ROAS — <span className="text-red-500">Pause</span></div>
          <div>↗ High Spend, High ROAS — <span className="text-emerald-500">Scale</span></div>
        </div>
      </Card>
    </section>
  );
}
