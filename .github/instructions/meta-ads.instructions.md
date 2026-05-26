---
applyTo: "**"
---

# Meta Ads Audit Dashboard — AI Domain Knowledge

This file is the **authoritative reference** for all business logic, KPI
formulas, audit flags, ecommerce benchmarks, and Meta Ads domain knowledge.  
Read it **in full** before writing any metric, threshold, flag, recommendation,
chart label, or scaling decision. Every number here is derived from the actual
codebase or from the account's real exported data.

---

## 1. Project Architecture

| Layer | Path | Role |
|---|---|---|
| Data pipeline | `lib/data-ingestion.ts` | Loads CSV → typed `CsvCampaign[]`, computes derived KPIs |
| Type contracts | `lib/mock-data.ts` | `Campaign`, `Ad`, `DailyInsight` interfaces — source of truth for shape |
| Fatigue engine | `lib/fatigue.ts` | `scoreFatigue()` — scores 0-100, returns stage 1-4 |
| Formatters | `lib/formatters.ts` | `fmt$`, `fmtPct`, `fmtROAS`, `fmtFreq`, `fmtNum` — never format raw numbers in components |
| CSV parser | `lib/csv-parser.ts` | `parseCsv()` + `num()` — `"-"` and `""` cells always return `0` |
| Meta API | `lib/meta-api.ts` | Server-only; token from `process.env.META_ACCESS_TOKEN` — never expose to client |
| API routes | `app/api/` | `/ads`, `/campaigns`, `/insights` — all server-side |
| Dashboard | `components/DashboardClient.tsx` | Root client component, receives data via React Query |
| Sections | `components/sections/` | Each chart/panel is its own file; no cross-section data fetching |

Data source priority (highest wins):
1. Meta Marketing API — when `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` are set
2. `data/campaigns.csv` / `data/ads.csv` — local CSV export
3. `lib/mock-data.ts` — always-available fallback

---

## 2. CSV Export Schema

### 2a. Column map — Meta Ads Manager export

The CSV headers come exactly from Meta's export. The pipeline reads them
via `row['Column name']` — any rename breaks ingestion.

| CSV Column | Internal field | Type | Notes |
|---|---|---|---|
| `Ad name` | `name` | string | Ad creative name; used as display label |
| `Delivery status` | `status` | string | `active` → `ACTIVE`, anything else → `PAUSED` |
| `Delivery level` | — | string | Always `ad` for ad-level exports |
| `Attribution setting` | — | string | e.g. `7-day click or 1-day view` |
| `Result type` | `objective` | string | e.g. `Website purchases`, `Messaging conversations started` |
| `Results` | `conversions` | number | Conversion count for the result type |
| `Reach` | `reach` | number | Unique people reached |
| `Frequency` | `frequency` | number | Average impressions per person |
| `Cost per result` | `cpa` (raw) | number | USD; prefer computed `spend/conversions` for consistency |
| `Amount spent (USD)` | `spend` | number | Total spend in USD |
| `Quality ranking` | `qualityRanking` | string | `Above average` / `Average` / `Below average - Bottom 35% of ads` / `-` |
| `Engagement rate ranking` | `engagementRanking` | string | Same scale as quality ranking |
| `Conversion rate ranking` | `conversionRanking` | string | Same scale as quality ranking |
| `Impressions` | `impressions` | number | Total ad impressions |
| `CPM (cost per 1,000 impressions)` | `cpm` | number | USD per 1 000 impressions |
| `Link clicks` | `clicks` | number | Clicks on the ad link (excludes page likes, shares) |
| `Shop clicks` | — | number | Clicks to Facebook/Instagram Shop; usually 0 for website campaigns |
| `CPC (cost per link click)` | `cpc` | number | USD per link click |
| `CTR (link click-through rate)` | `ctr` | number | Link clicks / Impressions × 100 (percent) |
| `Clicks (all)` | — | number | All click types (outbound + reactions + page likes …) |
| `CTR (all)` | — | number | Clicks (all) / Impressions × 100 |
| `CPC (all)` | — | number | Spend / Clicks (all) |
| `Landing page views` | `landingPageViews` | number | Confirmed page loads after the click |
| `Cost per landing page view` | — | number | Spend / LPV |
| `hold rate` | `holdRate` | number | Fraction (0–1) who watched ≥ 25 % of video — content quality signal |
| `hook rate` | `hookRate` | number | Fraction (0–1) who watched first 3 s — scroll-stop signal |
| `LPV rate` | `lpvRate` | number | LPV / Link clicks — landing-page load efficiency |
| `Reporting starts` | `reportingStart` | string | ISO date of period start |
| `Reporting ends` | `reportingEnd` | string | ISO date of period end |

### 2b. Sentinel values

- `"-"` in a numeric cell → treated as `0` by `num()` (ranking data not available)
- Empty string → `0`
- Scientific notation (`5.95E-6`) → parsed correctly by `parseFloat`
- `"Above average"` / `"Average"` / `"Below average - Bottom 35% of ads"` are the only three ranking strings Meta exports

### 2c. Totals row

The first data row (row index 0 after header) has an empty `Ad name` and
`Result type = "mixed"` — it is the account-level aggregate. The pipeline
filters it out with:
```ts
.filter(r => r['Campaign name'] && num(r['Amount spent (USD)']) > 0)
```
Never include it in per-ad or per-campaign aggregations.

---

## 3. KPI Formulas — Canonical Implementations

**Do not deviate from these formulas anywhere in the codebase.**

### 3a. Core metric calculations

```
ROAS             = (conversions × AOV_USD) / spend
CPA              = spend / conversions                  (0 when conversions = 0)
CPM              = (spend / impressions) × 1000
CTR              = (link_clicks / impressions) × 100    [percent]
CPC              = spend / link_clicks
LPV rate         = landing_page_views / link_clicks     [fraction 0–1]
Hook rate        = 3-second video views / impressions   [fraction 0–1]
Hold rate        = ThruPlays (≥25%) / impressions       [fraction 0–1]
Frequency        = impressions / reach
Conversion rate  = conversions / landing_page_views     [fraction 0–1]
Revenue          = conversions × AOV_USD
```

### 3b. AOV and period constants

**AOV (Average Order Value)** defaults to `$10 USD` — the `aovUsd` parameter
in `loadCampaigns()` and `computeKpis()`. This is the **only place** revenue
and ROAS are computed. Never hard-code revenue or AOV elsewhere.

```ts
const BASELINE    = { ctr: 3.8, cpc: 0.028, roas: 5.0 };
const PERIOD_DAYS = 332;   // 2025-06-25 → 2026-05-23
```

Estimated daily budget = `(total_spend / PERIOD_DAYS) × 1.3`  
Baselines are updated only when the account's healthy-phase data changes.

### 3c. Break-even ROAS formula

```
Break-even ROAS = 1 / gross_margin_rate

Example (50% margin): break-even = 1 / 0.50 = 2.0x
Example (30% margin): break-even = 1 / 0.30 = 3.33x
```

At `AOV = $10` with thin margins, any ROAS < 2.0 means the campaign is
**losing money after ad spend**. ROAS < 1.0 means you are spending more
than you gross — an absolute emergency stop.

### 3d. Ecommerce funnel conversion rates (each step)

```
Impression → Click       = CTR            target > 3%      (this account)
Click      → LPV         = LPV rate       target > 70%
LPV        → Conversion  = CVR            target > 3% (varies by product)
Overall    = CTR × LPV_rate × CVR
```

A drop at any stage pinpoints the problem layer:
- Low CTR → creative/hook is failing, not the landing page
- Low LPV rate → technical issue (slow page, broken redirect, meta pixel misfire)
- Low CVR with good CTR/LPV → pricing, trust signals, or offer weakness on site

### 3e. Creative type detection (from `loadAds`)

```ts
creativeType = hookRate > 0.005 ? 'VIDEO' : 'IMAGE'
```

`hookRate ≈ 0` almost always means no video — Meta does not populate
3-second-view data for static images. Image ads with hookRate of exactly 0
are correctly detected as IMAGE type.

---

## 4. Fatigue Scoring Engine

Source: `lib/fatigue.ts` → `scoreFatigue(input: FatigueInput): FatigueResult`

### 4a. Input fields

```ts
{
  frequency:    number,   // current avg impressions per person
  ctrCurrent:   number,   // current CTR %
  ctrBaseline:  number,   // healthy-phase CTR % — BASELINE.ctr = 3.8
  cpcCurrent:   number,   // current CPC USD
  cpcBaseline:  number,   // healthy-phase CPC USD — BASELINE.cpc = 0.028
  roas:         number,   // current ROAS
  roasBaseline: number,   // healthy-phase ROAS — BASELINE.roas = 5.0
}
```

### 4b. Derived decay signals

```
ctrDecline  = (ctrBaseline  - ctrCurrent)  / ctrBaseline   [0–1]
cpcIncrease = (cpcCurrent   - cpcBaseline) / cpcBaseline    [0–1]
roasDecline = (roasBaseline - roas)        / roasBaseline    [0–1]
```

These are **relative** changes. A `ctrDecline` of 0.45 means CTR has fallen
45% below the account's healthy baseline — a serious audience exhaustion signal.

### 4c. Stage thresholds (waterfall — first match wins)

| Stage | Label | Trigger conditions |
|---|---|---|
| **4** | Obvious Fatigue | `frequency > 5` OR (`ctrDecline > 0.45` AND `cpcIncrease > 0.45`) OR `roasDecline > 0.38` |
| **3** | Confirmed Fatigue | `frequency > 3` OR (`ctrDecline > 0.22` AND `cpcIncrease > 0.22`) OR `roasDecline > 0.18` |
| **2** | Early Fatigue | `frequency > 2` OR (`ctrDecline > 0.08` AND `cpcIncrease > 0.08`) |
| **1** | Fresh | None of the above |

### 4d. Score formula (0–100, higher = more fatigued)

```
Stage 4: min(100, 70 + frequency × 3)
Stage 3: min(100, 40 + frequency × 8)
Stage 2: min(100, 15 + frequency × 8)
Stage 1: max(0,   frequency × 4)
```

### 4e. Simplified stage from frequency alone (`data-ingestion.ts`)

```ts
frequency < 2.0 → Stage 1  (Fresh)
frequency < 3.2 → Stage 2  (Early Fatigue)
frequency < 4.5 → Stage 3  (Confirmed Fatigue)
otherwise       → Stage 4  (Obvious Fatigue)
```

### 4f. What frequency actually means in the Meta auction

- **Frequency = impressions / reach** — the average number of times each
  person in the audience has seen the ad.
- At frequency 2–3: audience is still warm. CTR may start softening.
- At frequency 3–5: auction overlap increases. Meta is forced to bid up CPMs
  to re-serve the same people. CPC spikes, ROAS falls.
- Above frequency 5: the ad set is running out of fresh audience. Meta shows
  ads to decreasingly relevant users, degrading all metrics simultaneously.
- Frequency rising fast (e.g. +0.1/day) signals a **small or over-targeted**
  audience — widen targeting or add a new audience before scaling spend.

### 4g. Stage colors

| Stage | Label | Color hex | Meaning for media buyer |
|---|---|---|---|
| 1 | Fresh | `#10b981` (emerald) | Scale spend 20-30% every 48h |
| 2 | Early Fatigue | `#f59e0b` (amber) | Watch daily; prep next creative batch |
| 3 | Confirmed Fatigue | `#f97316` (orange) | Launch replacements now; do not wait for ROAS to break |
| 4 | Obvious Fatigue | `#ef4444` (red) | Pause immediately; every extra dollar is wasted |

---

## 5. Audit Flags & Recommendations

Source: `components/sections/NextStepsPanel.tsx` → `buildRecommendations()`

### 5a. Priority levels

| Level | Color | When to use |
|---|---|---|
| `critical` | `#ef4444` red | Immediate revenue loss or ROAS below break-even |
| `warning` | `#f97316` orange | Deteriorating trend that will become critical if ignored |
| `info` | `#6366f1` indigo | Informational observation, no urgent action |
| `good` | `#10b981` emerald | Scaling opportunity or healthy pipeline confirmation |

### 5b. Implemented flag logic (exact conditions from `buildRecommendations`)

```
CRITICAL — Stage 4 creative fatigue
  Condition : ad.fatigueStage === 4
  Meaning   : Audience severely overexposed; ROAS broken; every extra impression
              drives up CPM for the entire account.
  Action    : Pause immediately. Replace with fresh creative. Do not duplicate
              the fatigued ad — the audience damage follows it.

CRITICAL — Campaign ROAS below break-even
  Condition : campaign.roas < 2
  Meaning   : You are spending more than you earn after product cost.
              This campaign actively destroys profit.
  Action    : Reduce budget 50% or pause. Audit: audience overlap, creative
              exhaustion, landing page conversion rate, pixel tracking gaps.

WARNING — Stage 3 creative fatigue
  Condition : ad.fatigueStage === 3
  Meaning   : CTR down >22% from baseline. CPC rising. ROAS under pressure.
              You have 48-72 hours before this becomes critical.
  Action    : Duplicate the ad set with a fresh creative variant now.
              Do NOT pause the current ad until the replacement has cleared
              Meta's learning phase (≥50 conversions in 7 days).

WARNING — High frequency
  Condition : campaign.frequency > 3.5 AND fatigueStage <= 3
  Meaning   : Audience is seeing the ad too often. CPM will begin rising.
              The algorithm is running out of new people to show the ad to.
  Action    : Launch 2-3 new creative variants immediately.
              Widen the audience (loosen age range, add interests, or use
              Advantage+ Audience). Do not increase budget until frequency drops.

GOOD — Scale opportunity
  Condition : campaign.fatigueStage === 1 AND campaign.roas > 4
  Meaning   : Fresh audience + above-target ROAS. Meta's algorithm is in an
              efficient learning phase. The window for profitable scaling is now.
  Action    : Increase daily budget by 20-30% every 48h. Never double overnight
              — it resets the learning phase and can crash ROAS.
```

### 5c. Compound flags (multi-signal — not yet in code, but use as logic guide)

These patterns are strong diagnostic signals to implement as future flags:

```
COMPOUND CRITICAL — Dead creative (image ads)
  Condition : hookRate ≈ 0 (IMAGE type) AND ctr < 1.5 AND roas < 2
  Meaning   : Static image with no scroll-stop power; audience ignores it.
  Action    : Replace with video or motion creative. Test new headline angles.

COMPOUND CRITICAL — Funnel collapse
  Condition : ctr > 3 AND lpvRate < 0.55
  Meaning   : People click but the landing page fails to load or is too slow.
              You are paying for clicks that never see your offer.
  Action    : Check page speed (< 3s), pixel firing, redirect chains.
              This loses money silently — high CTR masks the real CVR.

COMPOUND WARNING — Ranking degradation
  Condition : qualityRanking === 'below' AND engagementRanking === 'below'
  Meaning   : Meta's system has flagged this ad as low-quality. The auction
              penalises it with a higher effective CPM (quality-adjusted bid).
              This ad is paying more per impression than competitors.
  Action    : Refresh creative, tighten audience relevance, review ad copy
              for clickbait signals.

COMPOUND WARNING — Spend concentration risk
  Condition : single ad accounts for > 50% of total account spend
  Meaning   : Over-reliance on one creative. When it fatigues (and it will),
              the entire account revenue crashes simultaneously.
  Action    : Force-test at least 2 challenger creatives at 10-15% of budget.

COMPOUND WARNING — LPV rate decay
  Condition : lpvRate < 0.60 with ctr > 2.5
  Meaning   : Traffic quality is degrading. Broad audience expansion is sending
              unqualified clickers who bounce immediately.
  Action    : Narrow audience or exclude known low-intent segments.

COMPOUND INFO — Messaging campaign ROAS mismatch
  Condition : resultType === 'Messaging conversations started'
  Meaning   : Conversions here are conversation starts, NOT purchases.
              ROAS from AOV × conversations is meaningless for this campaign.
              Only compare CPC and CTR; revenue must come from CRM close rate.
  Action    : Never render ROAS for messaging objective campaigns. Show CPC
              and CPM only.
```

### 5d. Rankings — how Meta strings map to internal values

```ts
'Above average'                       → 'above'
'Average'                             → 'average'
'Below average - Bottom 35% of ads'   → 'below'
'-'  or ''                            → 'n/a'   (not enough data — new ad < 500 impressions)
```

**Ranking interpretation for ecommerce:**
- `quality 'below'` — Meta believes the ad experience is poor (misleading copy,
  low landing-page relevance). Penalised in auction with effective CPM uplift.
- `engagement 'below'` — Ad fails to generate saves, shares, comments at
  expected rates for the audience. Weak social proof compounds over time.
- `conversion 'below'` — Meta predicts this ad is unlikely to convert the
  target audience. Strong signal to replace creative or tighten audience.
- All three `'below'` simultaneously → the ad is being suppressed by the
  algorithm. Pause before it wastes more budget.

---

## 6. Ecommerce Performance Benchmarks (this account)

This account targets a **Moroccan / North-African audience** operating at
unusually low CPMs. Do not apply US or EU industry norms.

### 6a. Creative quality benchmarks

| Metric | Healthy ✅ | Warning ⚠️ | Critical 🔴 | What it measures |
|---|---|---|---|---|
| Hook rate | > 0.30 | 0.20–0.30 | < 0.20 | % who watched first 3 s — scroll-stop power |
| Hold rate | > 0.30 | 0.22–0.30 | < 0.22 | % who watched ≥ 25% — content relevance |
| LPV rate | > 0.70 | 0.60–0.70 | < 0.60 | Click → confirmed page load efficiency |
| CTR (link) | > 3.0% | 2.0–3.0% | < 2.0% | Ad click-through rate |
| Frequency | < 2.0 | 2.0–3.5 | > 3.5 | Audience exposure level |
| ROAS | > 4.0x | 2.0–4.0x | < 2.0x | Revenue per dollar spent |
| CPM | < $1.20 | $1.20–$2.00 | > $2.00 | Cost per 1 000 impressions |
| CPC | < $0.04 | $0.04–$0.07 | > $0.07 | Cost per link click |

### 6b. Video creative benchmarks (this account)

| Metric | Best performer observed | Account average | Minimum viable |
|---|---|---|---|
| Hook rate | 0.45 (gardinia ad 2) | ~0.30 | 0.20 |
| Hold rate | 0.45 (شجرة حب الملوك2) | ~0.30 | 0.22 |
| CTR | 8.59% (njass add 1) | ~3.0% | 2.0% |
| CPC | $0.020 (guava cbo) | ~$0.040 | $0.070 |

### 6c. Campaign-level benchmarks (this account — Jun 2025 to May 2026)

| Metric | Top performer | Account total | Notes |
|---|---|---|---|
| Spend (top campaign) | $2,075 (guava cbo add 2) | $42,888 total | |
| Conversions (top) | 1,145 (guava cbo add 2) | — | |
| CPA (best) | $1.03 (avocado add 1) | ~$1.50 avg | Extremely low — North African AOV |
| CPM (best) | $0.69 (Bougainvillier video 3) | ~$1.20 avg | |
| CTR (best) | 8.59% (njass add 1) | ~2.88% avg | |

---

## 7. Meta Auction Mechanics — What CPM Changes Mean

Understanding why CPMs move is essential for diagnosing campaign health:

### 7a. CPM is a symptom, not a cause

```
CPM rising + frequency rising   → audience exhaustion; same people being bid
                                   on repeatedly at higher prices
CPM rising + frequency stable   → market competition increasing (seasonality,
                                   competitor activity, iOS/event-based demand)
CPM falling + CTR falling       → Meta showing ad to cheaper but less relevant
                                   people — audience quality degrading
CPM falling + CTR stable        → healthy efficiency improvement or lower
                                   competition period
```

### 7b. Effective CPM vs. reported CPM

Meta's quality ranking system **adjusts the effective CPM** each ad pays in
the auction based on relevance scores:

```
Effective CPM = Reported CPM × quality_penalty_multiplier

quality 'above'   → multiplier ≈ 0.8–0.9  (pays less than average)
quality 'average' → multiplier ≈ 1.0
quality 'below'   → multiplier ≈ 1.2–1.5  (pays premium for low quality)
```

This is why two ads with the same bid can have very different CPMs — the
lower-quality ad is penalised in every single auction.

### 7c. Learning phase implications

Meta's algorithm requires **50 optimisation events per ad set per week** to
exit the learning phase. During learning:
- ROAS is volatile and often misleadingly low
- CPA is inflated (algorithm exploring)
- Never judge a campaign in learning phase — wait for 50+ conversions

```
If conversions / 7 days < 50:
  → Do not scale budget (resets learning)
  → Do not change audience (resets learning)
  → Do not change bid strategy (resets learning)
  → Wait, or consolidate ad sets to pool conversions
```

---

## 8. Budget Scaling Decision Logic

### 8a. Safe scaling rules (Stage 1 / healthy ROAS)

```
Current ROAS > 4.0 AND frequency < 2.0 AND CTR > 3.0%:
  → Increase budget by 20-30% every 48 hours
  → Maximum single increase: 30% (prevents learning phase reset)
  → Never double budget overnight

Current ROAS 3.0–4.0 AND frequency < 2.5:
  → Increase budget 10-15% every 72 hours
  → Monitor CPM closely — if CPM rises > 20% in 48h, pause scaling

Current ROAS 2.0–3.0:
  → Hold budget flat; optimise creatives before scaling
  → Test new audiences before increasing spend on existing ones
```

### 8b. Budget reduction rules

```
ROAS < 2.0:                       → Reduce 50% immediately
ROAS < 2.0 for 3+ consecutive days → Pause campaign; investigate
Frequency > 3.5:                  → Do NOT increase budget; add creatives first
CPM increased > 40% in 7 days:    → Likely audience exhaustion; pause + refresh
CPA > 2× target:                  → Reduce budget 30%; test new creative angle
```

### 8c. The 48-hour rule

Meta's delivery system re-optimises every ~48 hours. After any budget change,
wait **at least 48 hours** before evaluating the impact. Judging performance
within 24 hours of a change is unreliable.

---

## 9. Attribution Window — Impact on Reported Metrics

This account uses `7-day click or 1-day view` attribution.

### 9a. What this means for ROAS accuracy

```
7-day click:  Any purchase within 7 days of clicking the ad is attributed.
1-day view:   Any purchase within 1 day of seeing (not clicking) the ad is attributed.
```

**Implications:**
- ROAS appears **higher** than true media-driven ROAS because view-through
  conversions include people who would have bought anyway.
- When comparing campaigns, ensure all use the same attribution window.
- ROAS from messaging campaigns (`Messaging conversations started`) uses
  conversation starts as conversions — completely incomparable to purchase ROAS.
- For accurate incrementality, compare against a holdout group or use Meta's
  Conversion Lift studies.

### 9b. Attribution affects CPA too

```
CPA = spend / attributed_conversions
```

View-through attribution inflates conversion count → deflates CPA → makes
campaigns look more efficient than they are. Always check whether a campaign's
high conversion volume aligns with actual revenue in your store backend.

---

## 10. Creative Lifecycle — When to Act

### 10a. Typical creative lifespan at this account's scale

```
Days 1-3:    Learning phase — volatile ROAS, ignore short-term numbers
Days 4-14:   Peak performance window — scale if ROAS > 4
Days 14-30:  Frequency climbs 2.0-3.0 — monitor daily, prepare replacements
Days 30-60:  Stage 2-3 likely — launch new creatives now
Days 60+:    Stage 3-4 expected — most creatives are fatigued by this point
```

### 10b. The replacement rule

**Never pause a fatigued ad before the replacement has 50+ conversions.**

The algorithm needs the replacement to be "warmed up" before it can efficiently
take over traffic. The transition procedure:
1. Duplicate the ad set with a fresh creative
2. Run both in parallel for 7 days (allow new ad to exit learning phase)
3. Once new ad ROAS is proven (> 4x for 3 days), pause the fatigued one
4. Never delete old ads — keep them paused for reference data

### 10c. Creative iteration velocity

```
Healthy creative pipeline = at least 1 new creative tested per week
Minimum threshold         = 2 active creatives per ad set at all times
Warning                   = only 1 active creative left and frequency > 2.5
```

---

## 11. Synthetic Daily Data

When `data/daily.csv` is absent (current default), per-day trend data is
**estimated** using deterministic slope-based simulation in `makeTrendData()`
and `makeDailyData()`. The `syntheticDaily: true` flag on `CsvCampaign` marks
this. **Charts fed by synthetic data must never be presented as real historical
breakdowns to the user.**

### Slope multipliers per stage (per day)

| Stage | CTR slope | CPC slope | CPM slope | Freq slope |
|---|---|---|---|---|
| 1 Fresh | +0.010 | −0.0005 | −0.008 | +0.01 |
| 2 Early | −0.020 | +0.0015 | +0.015 | +0.04 |
| 3 Confirmed | −0.040 | +0.0030 | +0.035 | +0.07 |
| 4 Obvious | −0.065 | +0.0060 | +0.065 | +0.11 |

---

## 12. Formatting Rules

**Always use `lib/formatters.ts`.** Never call `.toFixed()` or
`.toLocaleString()` directly inside a component.

| Formatter | Input | Output example | Use for |
|---|---|---|---|
| `fmt$(v)` | USD number | `$1.2k`, `$820.85`, `$2.07M` | spend, CPA, CPC, CPM |
| `fmt$Full(v)` | USD number | `$1,234.56` | full-precision USD |
| `fmtPct(v, decimals?)` | percent (`3.25`) | `3.25%` | CTR, hook rate %, hold rate % |
| `fmtROAS(v)` | ratio | `3.29x` | ROAS only |
| `fmtNum(v)` | count | `1.2M`, `749.2k`, `1,234` | impressions, reach, clicks |
| `fmtFreq(v)` | frequency | `2.13` | frequency (2 decimal places) |
| `trendLabel(pct, inverse?)` | delta % | `{ label: "+12.3%", up: true }` | KPI change badges |

**KPI trend direction — `inverse: true` for metrics where lower is better:**
CPC, CPA, CPM, Frequency, Spend, Cost per LPV. All other metrics use default
(higher = better).

**Do NOT render ROAS for messaging objective campaigns** — conversions there
are conversation starts, not purchases. Show CPC and CTR only.

---

## 13. Security Constraints

- `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are **server-only** env vars.
  Never read `process.env.*` inside a `'use client'` component.
- All Meta API calls go through `app/api/` routes — never from the browser.
- CSV files in `data/` may contain PII (ad names with personal identifiers).
  Do not log raw CSV rows anywhere.
- Never expose raw spend or conversion data in client-side error messages.

---

## 14. Adding New Features — Checklist

When adding a new metric, chart, or audit rule:

1. **Type first** — add the field to the interface in `lib/mock-data.ts`
2. **Parse in pipeline** — add the CSV column read in `lib/data-ingestion.ts`
3. **Add mock value** — add a sensible default to the mock objects so the
   fallback path still works without a CSV present
4. **Format via formatter** — add to `lib/formatters.ts` if the display
   format is not already covered
5. **Audit flag** — if the metric can trigger a recommendation, add the rule
   in `buildRecommendations()` in `NextStepsPanel.tsx` following the priority
   framework in §5a
6. **i18n key** — add the label to `lib/i18n.ts`
7. **Messaging exemption** — if the metric is revenue-dependent (ROAS, CPA),
   guard it with `resultType !== 'Messaging conversations started'`
