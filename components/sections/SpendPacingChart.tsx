'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { fmt$ } from '@/lib/formatters';
import { useLang } from '@/components/providers/LangProvider';
import type { DailyInsight } from '@/lib/mock-data';

interface Props {
  data?: DailyInsight[];
  isLoading?: boolean;
  monthlyBudget?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold mb-2 text-slate-200">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-[var(--text-muted)]">{p.name}:</span>
          <span className="font-medium">{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function SpendPacingChart({ data, isLoading, monthlyBudget = 18000 }: Props) {
  const { t } = useLang();
  if (isLoading || !data) {
    return (
      <section id="spend" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.spendTitle}</CardTitle>
              <CardMuted>{t.spendSubtitlePrefix} {t.spendMonthlyBudget}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={260} />
        </Card>
      </section>
    );
  }

  // Build cumulative spend + daily budget ceiling
  let cumulative = 0;
  const dailyBudget = monthlyBudget / 30;
  let cumulativeBudget = 0;

  const chartData = data.map(d => {
    cumulative += d.spend;
    cumulativeBudget += dailyBudget;
    return {
      date:                    format(parseISO(d.date), 'MMM d'),
      [t.spendDaily]:          d.spend,
      [t.spendCumulative]:     Math.round(cumulative),
      [t.spendBudgetTarget]:   Math.round(cumulativeBudget),
    };
  });

  const overpacing = cumulative > cumulativeBudget;

  return (
    <section id="spend" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.spendTitle}</CardTitle>
            <CardMuted>
              {t.spendSubtitlePrefix} {fmt$(monthlyBudget)} {t.spendMonthlyBudget}
              {overpacing && (
                <span className="ml-2 text-orange-400 font-semibold">{t.spendOverpacing}</span>
              )}
            </CardMuted>
          </div>
          <p className="text-lg font-bold text-[var(--accent)]">
                {fmt$(cumulative)} <span className="text-xs font-normal text-[var(--text-muted)]">{t.spendSpent}</span>
          </p>
        </CardHeader>

        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
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
              yAxisId="daily"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <YAxis
              yAxisId="cum"
              orientation="right"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
            />
            <Bar
              yAxisId="daily"
              dataKey={t.spendDaily}
              fill="url(#spendGrad)"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
            <Line
              yAxisId="cum"
              type="monotone"
              dataKey={t.spendCumulative}
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="cum"
              type="monotone"
              dataKey={t.spendBudgetTarget}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </section>
  );
}
