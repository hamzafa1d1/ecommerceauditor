'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { fmt$, fmtROAS } from '@/lib/formatters';
import { useLang } from '@/components/providers/LangProvider';
import type { DailyInsight } from '@/lib/mock-data';

interface Props {
  data?: DailyInsight[];
  isLoading?: boolean;
}

export function RoasCpaChart({ data, isLoading }: Props) {
  const { t } = useLang();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="font-semibold mb-2 text-slate-200">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[var(--text-muted)]">{p.name}:</span>
            <span className="font-semibold">
              {p.name === 'ROAS' ? fmtROAS(p.value) : fmt$(p.value)}
            </span>
          </div>
        ))}
        {payload.length >= 2 && payload[0] && payload[1] && (
          <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1 border-t border-[var(--border)] pt-1">
            {payload[0].value < payload[1].value ? t.roasCpaBad : t.roasCpaGood}
          </p>
        )}
      </div>
    );
  };

  if (isLoading || !data) {
    return (
      <section id="roas-cpa" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.roasCpaTitle}</CardTitle>
              <CardMuted>{t.roasCpaWhen}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={260} />
        </Card>
      </section>
    );
  }

  const chartData = data.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    ROAS: d.roas,
    CPA:  d.cpa,
  }));

  // Detect crossing points for annotation
  const crossingDay = chartData.findIndex((d, i) => {
    if (i === 0) return false;
    const prev = chartData[i - 1];
    return (prev.ROAS > prev.CPA && d.ROAS <= d.CPA) ||
           (prev.ROAS < prev.CPA && d.ROAS >= d.CPA);
  });

  return (
    <section id="roas-cpa" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.roasCpaTitle}</CardTitle>
            <CardMuted>
              {t.roasCpaSubtitle}
            </CardMuted>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-[0.6rem] text-[var(--text-muted)]">{t.roasLatest}</p>
              <p className="font-bold text-[var(--c-roas)]">{fmtROAS(chartData.at(-1)!.ROAS)}</p>
            </div>
            <div>
              <p className="text-[0.6rem] text-[var(--text-muted)]">{t.cpaLatest}</p>
              <p className="font-bold text-[var(--c-cpa)]">{fmt$(chartData.at(-1)!.CPA)}</p>
            </div>
          </div>
        </CardHeader>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              yAxisId="roas"
              domain={[0, 'dataMax + 1']}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}x`}
              width={32}
            />
            <YAxis
              yAxisId="cpa"
              orientation="right"
              domain={[0, 'dataMax + 10']}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
            />
            {crossingDay > 0 && (
              <ReferenceLine
                yAxisId="roas"
                x={chartData[crossingDay].date}
                stroke="#ef4444"
                strokeDasharray="4 3"
                label={{ value: '⚠ crossing', position: 'top', fontSize: 9, fill: '#ef4444' }}
              />
            )}
            <Line
              yAxisId="roas"
              type="monotoneX"
              dataKey="ROAS"
              stroke="var(--c-roas)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              yAxisId="cpa"
              type="monotoneX"
              dataKey="CPA"
              stroke="var(--c-cpa)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </section>
  );
}
