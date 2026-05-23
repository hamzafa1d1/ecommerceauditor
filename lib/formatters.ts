export function fmt$( v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
}

export function fmt$Full(v: number): string {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function fmtPct(v: number, decimals = 2): string {
  return `${v.toFixed(decimals)}%`;
}

export function fmtNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

export function fmtROAS(v: number): string {
  return `${v.toFixed(2)}x`;
}

export function fmtFreq(v: number): string {
  return v.toFixed(2);
}

export function trendLabel(pct: number, inverse = false): { label: string; up: boolean } {
  const up = pct >= 0;
  // For metrics where higher is better (ROAS, CTR, Reach): up = good
  // For metrics where lower is better (CPC, CPA, CPM, Frequency): up = bad → inverse=true
  return {
    label: `${up ? '+' : ''}${pct.toFixed(1)}%`,
    up: inverse ? !up : up,
  };
}
