'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { fmtNum, fmtFreq } from '@/lib/formatters';
import { useLang } from '@/components/providers/LangProvider';
import type { DailyInsight } from '@/lib/mock-data';

interface Props {
  data?: DailyInsight[];
  isLoading?: boolean;
}

export function ReachImpressionsChart({ data, isLoading }: Props) {
  const { t } = useLang();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const impressions = payload.find((p: any) => p.dataKey === t.impressionsLabel)?.value ?? 0;
    const reach       = payload.find((p: any) => p.dataKey === t.reachLabel)?.value ?? 0;
    const freq        = reach > 0 ? (impressions / reach).toFixed(2) : '—';
    return (
      <div className="chart-tooltip">
        <p className="font-semibold mb-2 text-slate-200">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[var(--text-muted)]">{p.name}:</span>
            <span className="font-semibold">{fmtNum(p.value)}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs mt-1 border-t border-[var(--border)] pt-1">
          <span className="w-2 h-2 rounded-full shrink-0 bg-orange-400" />
          <span className="text-[var(--text-muted)]">{t.impliedFreq}:</span>
          <span className="font-semibold text-orange-400">{freq}</span>
        </div>
      </div>
    );
  };

  if (isLoading || !data) {
    return (
      <section id="reach" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.reachTitle}</CardTitle>
              <CardMuted>{t.reachSubtitleLoading}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={240} />
        </Card>
      </section>
    );
  }

  const chartData = data.map(d => ({
    date:              format(parseISO(d.date), 'MMM d'),
    [t.reachLabel]:       d.reach,
    [t.impressionsLabel]: d.impressions,
  }));

  const latestFreq = (() => {
    const last = data.at(-1);
    if (!last) return '—';
    return fmtFreq(last.impressions / last.reach);
  })();

  return (
    <section id="reach" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.reachTitle}</CardTitle>
            <CardMuted>
              {t.reachSubtitle}
            </CardMuted>
          </div>
          <div className="text-right">
            <p className="text-[0.6rem] text-[var(--text-muted)]">{t.latestFreq}</p>
            <p className="font-bold text-orange-400 text-lg">{latestFreq}</p>
          </div>
        </CardHeader>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey={t.impressionsLabel}
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#impressionsGrad)"
            />
            <Area
              type="monotone"
              dataKey={t.reachLabel}
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#reachGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </section>
  );
}
