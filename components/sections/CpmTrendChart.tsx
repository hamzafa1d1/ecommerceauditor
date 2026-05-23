'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { fmt$ } from '@/lib/formatters';
import { useLang } from '@/components/providers/LangProvider';

interface CpmPoint {
  date:  string;
  camp1: number;
  camp2: number;
  camp3: number;
  camp4: number;
  camp5: number;
}

interface Props {
  data?: CpmPoint[];
  isLoading?: boolean;
}

const LINES = [
  { key: 'camp1', name: 'Summer Sale',       color: '#6366f1' },
  { key: 'camp2', name: 'Retargeting 30d',   color: '#60a5fa' },
  { key: 'camp3', name: 'Lookalike 1%',      color: '#10b981' },
  { key: 'camp4', name: 'Interest Stack',    color: '#f97316' },
  { key: 'camp5', name: 'Broad Auto DABA',   color: '#ef4444' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold mb-2 text-slate-200">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-[var(--text-muted)] truncate" style={{ maxWidth: 120 }}>{p.name}:</span>
          <span className="font-semibold ml-auto">{fmt$(p.value)}</span>
        </div>
      ))}
      <p className="text-[0.6rem] text-[var(--text-dim)] mt-1 border-t border-[var(--border)] pt-1">
        Rising CPM across all = auction pressure · One campaign alone = creative fatigue
      </p>
    </div>
  );
};

export function CpmTrendChart({ data, isLoading }: Props) {
  const { t } = useLang();
  if (isLoading || !data) {
    return (
      <section id="cpm-trend" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.cpmTitle}</CardTitle>
              <CardMuted>{t.cpmSubtitle}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={260} />
        </Card>
      </section>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    date: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <section id="cpm-trend" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.cpmTitle}</CardTitle>
            <CardMuted>
              {t.cpmSubtitle}
            </CardMuted>
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
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v}`}
              width={36}
              domain={[0, 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
              formatter={(_: string, entry: any) => {
                const line = LINES.find(l => l.key === entry.dataKey);
                return line?.name ?? entry.dataKey;
              }}
            />
            {LINES.map(l => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={l.key === 'camp4' || l.key === 'camp5' ? 2.5 : 1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                opacity={l.key === 'camp4' || l.key === 'camp5' ? 1 : 0.7}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </section>
  );
}
