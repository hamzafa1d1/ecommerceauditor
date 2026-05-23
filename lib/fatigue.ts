export type FatigueStage = 1 | 2 | 3 | 4;

export interface FatigueResult {
  stage: FatigueStage;
  score: number;       // 0–100, higher = worse
  label: string;
  color: string;
  bgColor: string;
  signals: string[];
}

export interface FatigueInput {
  frequency: number;
  ctrCurrent: number;
  ctrBaseline: number;   // first 3-day average
  cpcCurrent: number;
  cpcBaseline: number;
  roas: number;
  roasBaseline: number;
}

const STAGE_META: Record<FatigueStage, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Fresh',             color: '#10b981', bgColor: 'rgba(16,185,129,0.12)' },
  2: { label: 'Early Fatigue',     color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  3: { label: 'Confirmed Fatigue', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  4: { label: 'Obvious Fatigue',   color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)'  },
};

export function scoreFatigue(input: FatigueInput): FatigueResult {
  const { frequency, ctrCurrent, ctrBaseline, cpcCurrent, cpcBaseline, roas, roasBaseline } = input;

  const ctrDecline  = ctrBaseline  > 0 ? (ctrBaseline  - ctrCurrent)  / ctrBaseline  : 0;
  const cpcIncrease = cpcBaseline  > 0 ? (cpcCurrent   - cpcBaseline)  / cpcBaseline  : 0;
  const roasDecline = roasBaseline > 0 ? (roasBaseline - roas)         / roasBaseline : 0;

  const signals: string[] = [];

  // Stage 4 — Obvious
  if (frequency > 5 || (ctrDecline > 0.45 && cpcIncrease > 0.45) || roasDecline > 0.38) {
    if (frequency > 5)       signals.push(`Frequency ${frequency.toFixed(1)} — audience severely overexposed`);
    if (ctrDecline  > 0.45)  signals.push(`CTR collapsed, down ${(ctrDecline  * 100).toFixed(0)}% from baseline`);
    if (cpcIncrease > 0.45)  signals.push(`CPC up ${(cpcIncrease * 100).toFixed(0)}% — paying for a dead audience`);
    if (roasDecline > 0.38)  signals.push(`ROAS broken — down ${(roasDecline  * 100).toFixed(0)}%`);
    const meta = STAGE_META[4];
    return { stage: 4, score: Math.min(100, 70 + frequency * 3), ...meta, signals };
  }

  // Stage 3 — Confirmed
  if (frequency > 3 || (ctrDecline > 0.22 && cpcIncrease > 0.22) || roasDecline > 0.18) {
    if (frequency > 3)       signals.push(`Frequency ${frequency.toFixed(1)} — climbing fast, rotate creative soon`);
    if (ctrDecline  > 0.22)  signals.push(`CTR clearly down ${(ctrDecline  * 100).toFixed(0)}%`);
    if (cpcIncrease > 0.22)  signals.push(`CPC getting expensive, up ${(cpcIncrease * 100).toFixed(0)}%`);
    if (roasDecline > 0.18)  signals.push(`ROAS under pressure`);
    const meta = STAGE_META[3];
    return { stage: 3, score: Math.min(100, 40 + frequency * 8), ...meta, signals };
  }

  // Stage 2 — Early
  if (frequency > 2 || (ctrDecline > 0.08 && cpcIncrease > 0.08)) {
    if (frequency > 2)       signals.push(`Frequency ${frequency.toFixed(1)} — watch closely`);
    if (ctrDecline  > 0.08)  signals.push(`CTR softening — down ${(ctrDecline  * 100).toFixed(0)}%`);
    if (cpcIncrease > 0.08)  signals.push(`CPC creeping up ${(cpcIncrease * 100).toFixed(0)}%`);
    const meta = STAGE_META[2];
    return { stage: 2, score: Math.min(100, 15 + frequency * 8), ...meta, signals };
  }

  // Stage 1 — Fresh
  const meta = STAGE_META[1];
  signals.push('Frequency healthy — audience is still fresh');
  signals.push('CTR performing at or above baseline');
  signals.push('CPC efficient — maximize spend now');
  return { stage: 1, score: Math.max(0, frequency * 4), ...meta, signals };
}

export function stageMeta(stage: FatigueStage) {
  return STAGE_META[stage];
}
