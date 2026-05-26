/**
 * Action engine — pure function that converts normalized campaign/ad data
 * into a priority-sorted list of actionable recommendations.
 *
 * To plug in a different data source later, just pass in Campaign[] and Ad[]
 * from whichever adapter (CSV, Meta API, etc.) — this module is data-source agnostic.
 */

import type { Campaign, Ad } from '@/lib/mock-data';

export type ActionPriority = 'critical' | 'warning' | 'opportunity';
export type ActionVerb     = 'Pause' | 'Scale' | 'Refresh' | 'Review';
export type ActionTarget   = 'campaign' | 'ad';

export interface ActionItem {
  id:           string;
  priority:     ActionPriority;
  verb:         ActionVerb;
  title:        string;
  reason:       string;
  affectedId:   string;
  affectedName: string;
  affectedType: ActionTarget;
  metrics: {
    roas?:      number;
    frequency?: number;
    ctr?:       number;
    cpa?:       number;
    spend?:     number;
    stage?:     number;
  };
}

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  critical:    0,
  warning:     1,
  opportunity: 2,
};

/**
 * Generate priority-sorted ActionItem[] from current campaign and ad snapshots.
 * Rules are checked in priority order — a single entity can emit at most one
 * Pause/Refresh/Review and at most one Scale action to avoid duplicate cards.
 */
export function buildActions(campaigns: Campaign[], ads: Ad[]): ActionItem[] {
  const items: ActionItem[] = [];

  // ── Ad-level rules ────────────────────────────────────────────────────────

  const seenAdRefresh = new Set<string>();

  for (const ad of ads) {
    // Stage 4 — Obvious fatigue → Pause (critical)
    if (ad.fatigueStage === 4) {
      seenAdRefresh.add(ad.id);
      items.push({
        id:           `ad-stage4-${ad.id}`,
        priority:     'critical',
        verb:         'Pause',
        title:        `Pause "${ad.name}"`,
        reason:       `Audience severely overexposed — frequency ${ad.frequency.toFixed(1)}x. ROAS is broken. Every extra day compounds your losses.`,
        affectedId:   ad.id,
        affectedName: ad.name,
        affectedType: 'ad',
        metrics:      { roas: ad.roas, frequency: ad.frequency, stage: 4, spend: ad.spend },
      });
    }

    // Stage 3 — Confirmed fatigue → Refresh (warning)
    else if (ad.fatigueStage === 3) {
      seenAdRefresh.add(ad.id);
      items.push({
        id:           `ad-stage3-${ad.id}`,
        priority:     'warning',
        verb:         'Refresh',
        title:        `Refresh creative: "${ad.name}"`,
        reason:       `CTR declining, CPC rising. Frequency at ${ad.frequency.toFixed(1)}x — prepare a replacement before it breaks.`,
        affectedId:   ad.id,
        affectedName: ad.name,
        affectedType: 'ad',
        metrics:      { frequency: ad.frequency, ctr: ad.ctr, stage: 3, spend: ad.spend },
      });
    }

    // Below-average quality ranking → Review (warning)
    else if (!seenAdRefresh.has(ad.id) && ad.qualityRanking === 'below') {
      seenAdRefresh.add(ad.id);
      items.push({
        id:           `ad-quality-${ad.id}`,
        priority:     'warning',
        verb:         'Review',
        title:        `Low quality score: "${ad.name}"`,
        reason:       `Meta flags this creative as below-average quality vs. peers. Improve visual clarity and ensure the ad matches the landing page.`,
        affectedId:   ad.id,
        affectedName: ad.name,
        affectedType: 'ad',
        metrics:      { ctr: ad.ctr, spend: ad.spend, stage: ad.fatigueStage },
      });
    }

    // Low CTR (active, enough impressions) → Refresh (warning)
    else if (
      !seenAdRefresh.has(ad.id) &&
      ad.status === 'ACTIVE' &&
      ad.ctr < 1.5 &&
      ad.impressions > 10_000
    ) {
      seenAdRefresh.add(ad.id);
      items.push({
        id:           `ad-ctr-${ad.id}`,
        priority:     'warning',
        verb:         'Refresh',
        title:        `Weak CTR on "${ad.name}"`,
        reason:       `CTR is ${ad.ctr.toFixed(2)}% — below the 1.5% benchmark. The creative is not stopping the scroll.`,
        affectedId:   ad.id,
        affectedName: ad.name,
        affectedType: 'ad',
        metrics:      { ctr: ad.ctr, spend: ad.spend, stage: ad.fatigueStage },
      });
    }

    // Scale opportunity — fresh, strong ROAS, active
    if (ad.status === 'ACTIVE' && ad.fatigueStage <= 2 && ad.roas >= 3 && ad.spend > 200) {
      items.push({
        id:           `ad-scale-${ad.id}`,
        priority:     'opportunity',
        verb:         'Scale',
        title:        `Scale "${ad.name}"`,
        reason:       `Fresh audience (freq ${ad.frequency.toFixed(1)}x), strong ROAS ${ad.roas.toFixed(1)}x. This is your scaling window — increase budget 20–30% every 48 h.`,
        affectedId:   ad.id,
        affectedName: ad.name,
        affectedType: 'ad',
        metrics:      { roas: ad.roas, frequency: ad.frequency, stage: ad.fatigueStage, spend: ad.spend },
      });
    }
  }

  // ── Campaign-level rules ──────────────────────────────────────────────────

  const seenCampRefresh = new Set<string>();

  for (const c of campaigns) {
    // ROAS below break-even on active campaign → Review (critical)
    if (c.status === 'ACTIVE' && c.roas < 1.5 && c.spend > 100) {
      seenCampRefresh.add(c.id);
      items.push({
        id:           `camp-roas-${c.id}`,
        priority:     'critical',
        verb:         'Review',
        title:        `"${c.name}" below break-even`,
        reason:       `ROAS ${c.roas.toFixed(2)}x — you may be losing money. CPA $${c.cpa.toFixed(2)}. Cut budget 50% and investigate audience overlap.`,
        affectedId:   c.id,
        affectedName: c.name,
        affectedType: 'campaign',
        metrics:      { roas: c.roas, cpa: c.cpa, frequency: c.frequency, spend: c.spend },
      });
    }

    // High frequency, active campaign → Refresh (warning)
    if (
      !seenCampRefresh.has(c.id) &&
      c.status === 'ACTIVE' &&
      c.frequency > 3.5 &&
      c.fatigueStage <= 3
    ) {
      seenCampRefresh.add(c.id);
      items.push({
        id:           `camp-freq-${c.id}`,
        priority:     'warning',
        verb:         'Refresh',
        title:        `Rotate creatives in "${c.name}"`,
        reason:       `Frequency ${c.frequency.toFixed(1)}x — audience has seen your ad too many times. CTR is softening, CPC is climbing.`,
        affectedId:   c.id,
        affectedName: c.name,
        affectedType: 'campaign',
        metrics:      { frequency: c.frequency, ctr: c.ctr, roas: c.roas, spend: c.spend },
      });
    }

    // Scale opportunity — low frequency, healthy ROAS, active
    if (c.status === 'ACTIVE' && c.fatigueStage <= 2 && c.roas >= 3 && c.spend > 500) {
      items.push({
        id:           `camp-scale-${c.id}`,
        priority:     'opportunity',
        verb:         'Scale',
        title:        `Scale "${c.name}"`,
        reason:       `ROAS ${c.roas.toFixed(1)}x, fresh audience (freq ${c.frequency.toFixed(1)}x). Increase daily budget 20–30% every 48 h — don't double overnight.`,
        affectedId:   c.id,
        affectedName: c.name,
        affectedType: 'campaign',
        metrics:      { roas: c.roas, frequency: c.frequency, spend: c.spend },
      });
    }
  }

  // ── Sort: critical → warning → opportunity, then highest spend first ──────
  return items.sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    return (b.metrics.spend ?? 0) - (a.metrics.spend ?? 0);
  });
}
