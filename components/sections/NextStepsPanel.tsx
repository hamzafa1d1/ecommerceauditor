'use client';

import { Card, CardHeader, CardTitle, CardMuted } from '@/components/ui/card';
import { stageMeta } from '@/lib/fatigue';
import { fmt$, fmtROAS } from '@/lib/formatters';
import type { Campaign, Ad } from '@/lib/mock-data';
import { AlertTriangle, TrendingDown, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { useLang } from '@/components/providers/LangProvider';
import type { Translations } from '@/lib/i18n';

interface Props {
  campaigns?: Campaign[];
  ads?: Ad[];
}

interface Recommendation {
  priority: 'critical' | 'warning' | 'info' | 'good';
  title: string;
  detail: string;
  action: string;
}

function buildRecommendations(campaigns: Campaign[], ads: Ad[]): Recommendation[] {
  const recs: Recommendation[] = [];

  // Stage 4 ads
  const stage4 = ads.filter(a => a.fatigueStage === 4);
  if (stage4.length > 0) {
    recs.push({
      priority: 'critical',
      title:    `${stage4.length} ad${stage4.length > 1 ? 's' : ''} in Stage 4 — Obvious Fatigue`,
      detail:   `${stage4.map(a => a.name).join(', ')} — audience is severely overexposed, ROAS broken.`,
      action:   'Pause immediately and replace with fresh creatives. Every extra day compounds your loss.',
    });
  }

  // Stage 3 ads
  const stage3 = ads.filter(a => a.fatigueStage === 3);
  if (stage3.length > 0) {
    recs.push({
      priority: 'warning',
      title:    `${stage3.length} ad${stage3.length > 1 ? 's' : ''} in Stage 3 — Confirmed Fatigue`,
      detail:   `CTR down >25% from baseline. CPC getting expensive. ROAS under pressure.`,
      action:   'Prepare replacement creatives now. Duplicate ad sets with new creatives before pausing.',
    });
  }

  // Low ROAS campaigns
  const badRoas = campaigns.filter(c => c.roas < 2);
  if (badRoas.length > 0) {
    badRoas.forEach(c => {
      recs.push({
        priority: 'critical',
        title:    `"${c.name}" ROAS is ${fmtROAS(c.roas)} — below break-even`,
        detail:   `CPA of ${fmt$(c.cpa)} with ROAS under 2x means you are likely losing money on this campaign.`,
        action:   'Reduce budget by 50%, refresh all creatives, or pause and investigate audience overlap.',
      });
    });
  }

  // High frequency warning
  const highFreq = campaigns.filter(c => c.frequency > 3.5 && c.fatigueStage <= 3);
  highFreq.forEach(c => {
    recs.push({
      priority: 'warning',
      title:    `"${c.name}" frequency at ${c.frequency.toFixed(1)} — rotate now`,
      detail:   `Audience has seen your ad ${c.frequency.toFixed(1)}x on average. CTR is softening, CPC is rising.`,
      action:   'Launch 2-3 new creative variants immediately. Do not wait for ROAS to break.',
    });
  });

  // Scale opportunities (Stage 1, ROAS > 4)
  const winners = campaigns.filter(c => c.fatigueStage === 1 && c.roas > 4);
  if (winners.length > 0) {
    winners.forEach(c => {
      recs.push({
        priority: 'good',
        title:    `"${c.name}" is performing strongly — scale opportunity`,
        detail:   `ROAS ${fmtROAS(c.roas)}, CTR ${c.ctr.toFixed(2)}%, Frequency ${c.frequency.toFixed(2)} — fresh audience, healthy metrics.`,
        action:   `Increase daily budget by 20-30% every 48h. Avoid doubling overnight — let the algorithm stabilize.`,
      });
    });
  }

  // General healthy state
  if (recs.every(r => r.priority === 'good' || r.priority === 'info') && stage3.length === 0 && stage4.length === 0) {
    recs.push({
      priority: 'good',
      title:    'Creative pipeline is healthy',
      detail:   'No critical fatigue detected across active campaigns.',
      action:   'Prepare next batch of creatives proactively — the best media buyers launch the next creative before fatigue arrives.',
    });
  }

  return recs;
}

export function NextStepsPanel({ campaigns, ads }: Props) {
  if (!campaigns || !ads) return null;

  const { t } = useLang();

  const PRIORITY_CONFIG = {
    critical: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.06)',    border: 'rgba(239,68,68,0.2)',    label: t.priorityCritical },
    warning:  { icon: TrendingDown,  color: '#f97316', bg: 'rgba(249,115,22,0.06)',   border: 'rgba(249,115,22,0.2)',   label: t.priorityWarning  },
    info:     { icon: Zap,           color: '#6366f1', bg: 'rgba(99,102,241,0.06)',   border: 'rgba(99,102,241,0.2)',   label: t.priorityInfo     },
    good:     { icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.06)',   border: 'rgba(16,185,129,0.2)',   label: t.priorityGood    },
  };

  const recs = buildRecommendations(campaigns, ads);

  return (
    <section id="next-steps" className="scroll-mt-4">
      <Card>
        <CardHeader>
          <div>
                <CardTitle>{t.nextTitle}</CardTitle>
            <CardMuted>
              {t.nextSubtitle}
            </CardMuted>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/20">
            {recs.length} {recs.length !== 1 ? t.nextActions : t.nextAction}
          </div>
        </CardHeader>

        <div className="space-y-3">
          {recs.map((rec, i) => {
            const cfg  = PRIORITY_CONFIG[rec.priority];
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className="rounded-xl p-4 flex gap-3"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color: cfg.color, background: `${cfg.color}15` }}
                    >
                      {cfg.label}
                    </span>
                    <p className="text-sm font-semibold text-slate-200">{rec.title}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">{rec.detail}</p>
                  <div className="flex items-start gap-1.5 bg-[var(--border-subtle)] rounded-lg p-2.5">
                    <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: cfg.color }} />
                    <p className="text-xs font-medium text-slate-300">{rec.action}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[0.6rem] text-[var(--text-dim)] text-center">
          {t.nextFooter}
        </p>
      </Card>
    </section>
  );
}
