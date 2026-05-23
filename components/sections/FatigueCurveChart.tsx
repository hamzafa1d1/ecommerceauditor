'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceArea, ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { fmtPct, fmt$, fmtROAS } from '@/lib/formatters';
import type { FatigueCurvePoint } from '@/lib/mock-data';
import { useLang } from '@/components/providers/LangProvider';

interface Props {
  data?: FatigueCurvePoint[];
  isLoading?: boolean;
  currentDay?: number;
}

const STAGE_BANDS = [
  { x1: 1,  x2: 10, label: 'Stage 1\nFresh',     color: '#10b981' },
  { x1: 11, x2: 20, label: 'Stage 2\nEarly',      color: '#f59e0b' },
  { x1: 21, x2: 32, label: 'Stage 3\nConfirmed',  color: '#f97316' },
  { x1: 33, x2: 45, label: 'Stage 4\nObvious',    color: '#ef4444' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as FatigueCurvePoint;
  if (!d) return null;

  return (
    <div className="chart-tooltip min-w-[180px]">
      <p className="font-semibold mb-1 text-slate-200">Day {d.day}</p>
      <p className="text-[0.6rem] text-[var(--text-muted)] mb-2">
        Stage {d.stage} — {['','Fresh','Early Fatigue','Confirmed Fatigue','Obvious Fatigue'][d.stage]}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-amber-400">Frequency</span>
          <span>{d.freqRaw}x &nbsp;<span className="text-[var(--text-muted)]">({d.frequency > 0 ? '+' : ''}{d.frequency}%)</span></span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-blue-400">CTR</span>
          <span>{fmtPct(d.ctrRaw, 2)} &nbsp;<span className="text-[var(--text-muted)]">({d.ctr}%)</span></span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-violet-400">CPC</span>
          <span>{fmt$(d.cpcRaw)} &nbsp;<span className="text-[var(--text-muted)]">({d.cpc > 0 ? '+' : ''}{d.cpc}%)</span></span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-orange-400">CPA</span>
          <span>{fmt$(d.cpaRaw)} &nbsp;<span className="text-[var(--text-muted)]">({d.cpa > 0 ? '+' : ''}{d.cpa}%)</span></span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400">ROAS</span>
          <span>{fmtROAS(d.roasRaw)} &nbsp;<span className="text-[var(--text-muted)]">({d.roas}%)</span></span>
        </div>
      </div>
    </div>
  );
};

export function FatigueCurveChart({ data, isLoading, currentDay = 28 }: Props) {
  const { t } = useLang();
  if (isLoading || !data) {
    return (
      <section id="fatigue" className="scroll-mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t.fatigueTitle}</CardTitle>
              <CardMuted>{t.fatigueSubtitle}</CardMuted>
            </div>
          </CardHeader>
          <ChartSkeleton height={320} />
        </Card>
      </section>
    );
  }

  return (
    <section id="fatigue" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.fatigueTitle}</CardTitle>
            <CardMuted>
              {t.fatigueSubtitle}
            </CardMuted>
          </div>
          <div className="text-xs text-[var(--text-muted)] flex gap-4">
            <span className="text-[0.6rem]">Y-axis = % change from Day 1</span>
          </div>
        </CardHeader>

        {/* Stage legend */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {STAGE_BANDS.map(s => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6rem] font-semibold border"
              style={{ color: s.color, borderColor: `${s.color}40`, background: `${s.color}10` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.label.replace('\n', ' ')}
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            {/* Stage background bands */}
            {STAGE_BANDS.map(s => (
              <ReferenceArea
                key={s.label}
                x1={s.x1} x2={s.x2}
                fill={s.color}
                fillOpacity={0.04}
                stroke={s.color}
                strokeOpacity={0.15}
                strokeWidth={1}
              />
            ))}

            {/* Stage boundary lines */}
            {[10, 20, 32].map(x => (
              <ReferenceLine
                key={x}
                x={x}
                stroke="#334155"
                strokeDasharray="4 3"
                strokeWidth={1}
              />
            ))}

            {/* Current day marker */}
            <ReferenceLine
              x={currentDay}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: '▼ Today', position: 'top', fontSize: 9, fill: '#ef4444', offset: 4 }}
            />

            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Day →', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#475569' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
              width={44}
              domain={[-100, 'dataMax + 20']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
            />

            <Line type="monotone" dataKey="frequency" name="Frequency"  stroke="var(--c-frequency)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="ctr"       name="CTR"        stroke="var(--c-ctr)"       strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="cpc"       name="CPC"        stroke="var(--c-cpc)"       strokeWidth={2}   dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="cpa"       name="CPA"        stroke="var(--c-cpa)"       strokeWidth={2}   dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="roas"      name="ROAS"       stroke="var(--c-roas)"      strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="6 2" />
          </LineChart>
        </ResponsiveContainer>

        {/* Stage descriptions */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { stage: 1, color: '#10b981', bullets: ['Frequency stable','CTR healthy','CPC efficient','ROAS strong'] },
            { stage: 2, color: '#f59e0b', bullets: ['Frequency rising','CTR softening','CPC creeping up','ROAS still fine'] },
            { stage: 3, color: '#f97316', bullets: ['Frequency elevated','CTR clearly down','CPC expensive','ROAS under pressure'] },
            { stage: 4, color: '#ef4444', bullets: ['Frequency too high','CTR weak','CPA bad','ROAS broken'] },
          ].map(s => (
            <div key={s.stage} className="rounded-lg p-3" style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
              <p className="text-xs font-bold mb-2" style={{ color: s.color }}>Stage {s.stage}</p>
              <ul className="space-y-0.5">
                {s.bullets.map(b => (
                  <li key={b} className="text-[0.6rem] text-[var(--text-muted)] flex items-start gap-1">
                    <span style={{ color: s.color }} className="mt-0.5">·</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
