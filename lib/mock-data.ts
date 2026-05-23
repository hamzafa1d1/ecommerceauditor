import type { FatigueStage } from './fatigue';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyInsight {
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  frequency: number;
  roas: number;
  cpa: number;
  conversions: number;
  revenue: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  objective: string;
  dailyBudget: number;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  frequency: number;
  roas: number;
  cpa: number;
  conversions: number;
  revenue: number;
  fatigueStage: FatigueStage;
  fatigueScore: number;
  ctrBaseline: number;
  cpcBaseline: number;
  roasBaseline: number;
  dailyData: { date: string; spend: number; roas: number; ctr: number; cpm: number }[];
}

export interface Ad {
  id: string;
  campaignId: string;
  campaignName: string;
  adSetName: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  creativeType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  gradientFrom: string;
  gradientTo: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  landingPageViews: number;
  cpc: number;
  cpm: number;
  ctr: number;
  frequency: number;
  roas: number;
  cpa: number;
  conversions: number;
  revenue: number;
  fatigueStage: FatigueStage;
  fatigueScore: number;
  ctrBaseline: number;
  cpcBaseline: number;
  roasBaseline: number;
  trendData: { date: string; ctr: number; cpc: number; cpm: number; frequency: number }[];
  // Creative metrics (populated when data/ads.csv is present)
  hookRate?: number;                                       // 0–1 fraction
  holdRate?: number;                                       // 0–1 fraction
  lpvRate?: number;                                        // 0–1 fraction
  qualityRanking?:    'above' | 'average' | 'below' | 'n/a';
  engagementRanking?: 'above' | 'average' | 'below' | 'n/a';
  conversionRanking?: 'above' | 'average' | 'below' | 'n/a';
  costPerResult?: number;                                  // USD per conversion
  resultType?:    string;                                  // e.g. "Website purchases"
}

export interface FatigueCurvePoint {
  day: number;
  stage: FatigueStage;
  frequency: number;  ctr: number;  cpc: number;  cpa: number;  roas: number;
  freqRaw: number;   ctrRaw: number; cpcRaw: number; cpaRaw: number; roasRaw: number;
}

// ─── Overview KPI Totals ─────────────────────────────────────────────────────

export const MOCK_KPI_CURRENT = {
  spend:       10_800,
  revenue:     35_568,
  roas:        3.29,
  cpm:         18.42,
  ctr:         1.54,
  cpc:         1.19,
  cpa:         39.42,
  reach:       206_500,
  impressions: 586_000,
  frequency:   2.84,
  conversions: 274,
};

export const MOCK_KPI_PREV = {
  spend:       9_450,
  revenue:     37_422,
  roas:        3.96,
  cpm:         14.88,
  ctr:         2.01,
  cpc:         0.74,
  cpa:         28.11,
  reach:       214_000,
  impressions: 634_800,
  frequency:   2.11,
  conversions: 336,
};

// ─── Daily Overview (30 days: Apr 24 – May 23 2026) ──────────────────────────

export const MOCK_DAILY_INSIGHTS: DailyInsight[] = [
  { date:'2026-04-24', spend:322,  impressions:28200, reach:23900, clicks:535,  cpc:0.60, cpm:11.42, ctr:1.90, frequency:1.18, roas:4.50, cpa:24.77, conversions:13,  revenue:1449 },
  { date:'2026-04-25', spend:341,  impressions:29500, reach:24800, clicks:560,  cpc:0.61, cpm:11.56, ctr:1.90, frequency:1.19, roas:4.52, cpa:24.36, conversions:14,  revenue:1541 },
  { date:'2026-04-26', spend:295,  impressions:25400, reach:21400, clicks:483,  cpc:0.61, cpm:11.61, ctr:1.90, frequency:1.19, roas:4.45, cpa:25.43, conversions:11,  revenue:1313 },
  { date:'2026-04-27', spend:278,  impressions:23900, reach:20200, clicks:454,  cpc:0.61, cpm:11.63, ctr:1.90, frequency:1.18, roas:4.40, cpa:25.27, conversions:11,  revenue:1223 },
  { date:'2026-04-28', spend:356,  impressions:30400, reach:25500, clicks:577,  cpc:0.62, cpm:11.71, ctr:1.90, frequency:1.19, roas:4.48, cpa:24.55, conversions:14,  revenue:1595 },
  { date:'2026-04-29', spend:375,  impressions:31900, reach:26700, clicks:608,  cpc:0.62, cpm:11.76, ctr:1.91, frequency:1.19, roas:4.51, cpa:23.44, conversions:16,  revenue:1691 },
  { date:'2026-04-30', spend:363,  impressions:30900, reach:25900, clicks:589,  cpc:0.62, cpm:11.75, ctr:1.91, frequency:1.19, roas:4.48, cpa:24.20, conversions:15,  revenue:1627 },
  { date:'2026-05-01', spend:380,  impressions:31800, reach:26200, clicks:604,  cpc:0.63, cpm:11.95, ctr:1.90, frequency:1.21, roas:4.35, cpa:25.33, conversions:15,  revenue:1653 },
  { date:'2026-05-02', spend:392,  impressions:32600, reach:26700, clicks:618,  cpc:0.63, cpm:12.02, ctr:1.90, frequency:1.22, roas:4.28, cpa:26.13, conversions:15,  revenue:1678 },
  { date:'2026-05-03', spend:341,  impressions:28200, reach:23000, clicks:535,  cpc:0.64, cpm:12.09, ctr:1.90, frequency:1.23, roas:4.21, cpa:26.23, conversions:13,  revenue:1436 },
  { date:'2026-05-04', spend:318,  impressions:26200, reach:21400, clicks:497,  cpc:0.64, cpm:12.14, ctr:1.90, frequency:1.22, roas:4.18, cpa:26.50, conversions:12,  revenue:1329 },
  { date:'2026-05-05', spend:399,  impressions:32600, reach:26400, clicks:619,  cpc:0.64, cpm:12.24, ctr:1.90, frequency:1.23, roas:4.10, cpa:27.31, conversions:14,  revenue:1636 },
  { date:'2026-05-06', spend:412,  impressions:33400, reach:26700, clicks:635,  cpc:0.65, cpm:12.34, ctr:1.90, frequency:1.25, roas:4.00, cpa:27.47, conversions:15,  revenue:1648 },
  { date:'2026-05-07', spend:405,  impressions:32600, reach:26000, clicks:619,  cpc:0.65, cpm:12.42, ctr:1.90, frequency:1.25, roas:3.94, cpa:27.70, conversions:14,  revenue:1596 },
  { date:'2026-05-08', spend:388,  impressions:30500, reach:24000, clicks:549,  cpc:0.71, cpm:12.72, ctr:1.80, frequency:1.27, roas:3.82, cpa:29.85, conversions:13,  revenue:1482 },
  { date:'2026-05-09', spend:401,  impressions:31400, reach:24600, clicks:565,  cpc:0.71, cpm:12.77, ctr:1.80, frequency:1.28, roas:3.75, cpa:30.85, conversions:13,  revenue:1504 },
  { date:'2026-05-10', spend:347,  impressions:27200, reach:21200, clicks:490,  cpc:0.71, cpm:12.76, ctr:1.80, frequency:1.28, roas:3.70, cpa:31.55, conversions:11,  revenue:1284 },
  { date:'2026-05-11', spend:325,  impressions:25500, reach:19900, clicks:459,  cpc:0.71, cpm:12.75, ctr:1.80, frequency:1.28, roas:3.66, cpa:32.50, conversions:10,  revenue:1190 },
  { date:'2026-05-12', spend:418,  impressions:32600, reach:25300, clicks:587,  cpc:0.71, cpm:12.82, ctr:1.80, frequency:1.29, roas:3.59, cpa:32.15, conversions:13,  revenue:1501 },
  { date:'2026-05-13', spend:431,  impressions:33600, reach:26000, clicks:605,  cpc:0.71, cpm:12.83, ctr:1.80, frequency:1.29, roas:3.52, cpa:33.15, conversions:13,  revenue:1517 },
  { date:'2026-05-14', spend:422,  impressions:32900, reach:25500, clicks:592,  cpc:0.71, cpm:12.83, ctr:1.80, frequency:1.29, roas:3.47, cpa:33.23, conversions:12,  revenue:1464 },
  { date:'2026-05-15', spend:395,  impressions:28500, reach:21200, clicks:456,  cpc:0.87, cpm:13.86, ctr:1.60, frequency:1.35, roas:3.28, cpa:36.57, conversions:10,  revenue:1296 },
  { date:'2026-05-16', spend:408,  impressions:29400, reach:21800, clicks:470,  cpc:0.87, cpm:13.88, ctr:1.60, frequency:1.35, roas:3.22, cpa:37.45, conversions:10,  revenue:1314 },
  { date:'2026-05-17', spend:354,  impressions:25500, reach:18900, clicks:408,  cpc:0.87, cpm:13.88, ctr:1.60, frequency:1.35, roas:3.17, cpa:38.48, conversions:9,   revenue:1122 },
  { date:'2026-05-18', spend:331,  impressions:23900, reach:17700, clicks:382,  cpc:0.87, cpm:13.85, ctr:1.60, frequency:1.35, roas:3.13, cpa:39.40, conversions:8,   revenue:1036 },
  { date:'2026-05-19', spend:427,  impressions:30900, reach:22700, clicks:494,  cpc:0.86, cpm:13.82, ctr:1.60, frequency:1.36, roas:3.06, cpa:40.10, conversions:10,  revenue:1307 },
  { date:'2026-05-20', spend:441,  impressions:31800, reach:23200, clicks:509,  cpc:0.87, cpm:13.87, ctr:1.60, frequency:1.37, roas:2.98, cpa:40.55, conversions:10,  revenue:1314 },
  { date:'2026-05-21', spend:430,  impressions:31000, reach:22600, clicks:496,  cpc:0.87, cpm:13.87, ctr:1.60, frequency:1.37, roas:2.92, cpa:41.35, conversions:10,  revenue:1256 },
  { date:'2026-05-22', spend:415,  impressions:27100, reach:18100, clicks:379,  cpc:1.10, cpm:15.32, ctr:1.40, frequency:1.50, roas:2.75, cpa:46.11, conversions:9,   revenue:1141 },
  { date:'2026-05-23', spend:421,  impressions:27500, reach:18300, clicks:385,  cpc:1.09, cpm:15.31, ctr:1.40, frequency:1.50, roas:2.70, cpa:46.78, conversions:9,   revenue:1137 },
];

// ─── Campaigns ───────────────────────────────────────────────────────────────

const DATES_7 = ['2026-05-17','2026-05-18','2026-05-19','2026-05-20','2026-05-21','2026-05-22','2026-05-23'];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_001',
    name: 'Summer Sale — Prospecting',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    dailyBudget: 250,
    spend: 2450, impressions: 208000, reach: 174000, clicks: 4762,
    cpc: 0.51, cpm: 11.78, ctr: 2.29, frequency: 1.20,
    roas: 5.10, cpa: 21.88, conversions: 112, revenue: 12495,
    fatigueStage: 1, fatigueScore: 8,
    ctrBaseline: 2.35, cpcBaseline: 0.49, roasBaseline: 5.35,
    dailyData: DATES_7.map((date, i) => ({
      date, spend: 330+i*5, roas: 5.2-i*0.02, ctr: 2.31-i*0.01, cpm: 11.6+i*0.1,
    })),
  },
  {
    id: 'camp_002',
    name: 'Retargeting 30d Visitors',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    dailyBudget: 150,
    spend: 1890, impressions: 94500, reach: 72000, clicks: 1701,
    cpc: 1.11, cpm: 20.00, ctr: 1.80, frequency: 1.31,
    roas: 3.80, cpa: 31.50, conversions: 60, revenue: 7182,
    fatigueStage: 2, fatigueScore: 28,
    ctrBaseline: 2.20, cpcBaseline: 0.86, roasBaseline: 4.50,
    dailyData: DATES_7.map((date, i) => ({
      date, spend: 260+i*3, roas: 4.0-i*0.07, ctr: 1.95-i*0.04, cpm: 19.2+i*0.25,
    })),
  },
  {
    id: 'camp_003',
    name: 'Lookalike 1% — Top Buyers',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    dailyBudget: 200,
    spend: 2860, impressions: 148000, reach: 98000, clicks: 2664,
    cpc: 1.07, cpm: 19.32, ctr: 1.80, frequency: 1.51,
    roas: 3.20, cpa: 35.75, conversions: 80, revenue: 9152,
    fatigueStage: 2, fatigueScore: 34,
    ctrBaseline: 2.15, cpcBaseline: 0.82, roasBaseline: 4.10,
    dailyData: DATES_7.map((date, i) => ({
      date, spend: 390+i*4, roas: 3.5-i*0.08, ctr: 1.95-i*0.04, cpm: 18.8+i*0.3,
    })),
  },
  {
    id: 'camp_004',
    name: 'Interest Stack — Fitness Audience',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    dailyBudget: 120,
    spend: 2160, impressions: 74000, reach: 42000, clicks: 666,
    cpc: 3.24, cpm: 29.19, ctr: 0.90, frequency: 1.76,
    roas: 1.80, cpa: 64.48, conversions: 33, revenue: 3888,
    fatigueStage: 3, fatigueScore: 62,
    ctrBaseline: 2.20, cpcBaseline: 0.91, roasBaseline: 4.20,
    dailyData: DATES_7.map((date, i) => ({
      date, spend: 295+i*2, roas: 2.1-i*0.08, ctr: 1.05-i*0.04, cpm: 27.8+i*0.5,
    })),
  },
  {
    id: 'camp_005',
    name: 'Broad Auto DABA',
    status: 'ACTIVE',
    objective: 'CATALOG_SALES',
    dailyBudget: 80,
    spend: 1440, impressions: 41000, reach: 14000, clicks: 164,
    cpc: 8.78, cpm: 35.12, ctr: 0.40, frequency: 2.93,
    roas: 0.80, cpa: 160.0, conversions: 9, revenue: 1152,
    fatigueStage: 4, fatigueScore: 88,
    ctrBaseline: 2.10, cpcBaseline: 0.88, roasBaseline: 4.00,
    dailyData: DATES_7.map((date, i) => ({
      date, spend: 195+i*2, roas: 1.1-i*0.08, ctr: 0.55-i*0.04, cpm: 33.5+i*0.6,
    })),
  },
];

// ─── Ads (3 per campaign = 15 ads) ──────────────────────────────────────────

function adTrend(baseCtr: number, baseCpc: number, baseCpm: number, ctrSlope: number, cpcSlope: number) {
  return DATES_7.map((date, i) => ({
    date,
    ctr:       Math.max(0.1, baseCtr + ctrSlope * i),
    cpc:       baseCpc + cpcSlope * i,
    cpm:       baseCpm + 0.15 * i,
    frequency: 1.0 + 0.08 * i,
  }));
}

export const MOCK_ADS: Ad[] = [
  // Camp 1 — Stage 1 (Fresh)
  {
    id:'ad_001', campaignId:'camp_001', campaignName:'Summer Sale — Prospecting', adSetName:'Cold US 25-44',
    name:'Summer Flash — Static Banner', status:'ACTIVE', creativeType:'IMAGE',
    gradientFrom:'#6366f1', gradientTo:'#8b5cf6',
    spend:820, impressions:70500, reach:59200, clicks:1622, landingPageViews:1450,
    cpc:0.51, cpm:11.63, ctr:2.30, frequency:1.19, roas:5.20, cpa:21.05, conversions:39, revenue:4264,
    fatigueStage:1, fatigueScore:6, ctrBaseline:2.38, cpcBaseline:0.48, roasBaseline:5.42,
    trendData: adTrend(2.35, 0.49, 11.4, -0.005, 0.003),
  },
  {
    id:'ad_002', campaignId:'camp_001', campaignName:'Summer Sale — Prospecting', adSetName:'Cold US 25-44',
    name:'Summer Flash — Video 15s', status:'ACTIVE', creativeType:'VIDEO',
    gradientFrom:'#0ea5e9', gradientTo:'#6366f1',
    spend:895, impressions:76800, reach:64400, clicks:1763, landingPageViews:1590,
    cpc:0.51, cpm:11.65, ctr:2.30, frequency:1.19, roas:5.15, cpa:21.31, conversions:42, revenue:4609,
    fatigueStage:1, fatigueScore:7, ctrBaseline:2.36, cpcBaseline:0.49, roasBaseline:5.30,
    trendData: adTrend(2.33, 0.50, 11.5, -0.006, 0.003),
  },
  {
    id:'ad_003', campaignId:'camp_001', campaignName:'Summer Sale — Prospecting', adSetName:'Broad 18-54',
    name:'Summer Flash — Carousel', status:'ACTIVE', creativeType:'CAROUSEL',
    gradientFrom:'#10b981', gradientTo:'#0ea5e9',
    spend:735, impressions:60700, reach:50400, clicks:1397, landingPageViews:1210,
    cpc:0.53, cpm:12.11, ctr:2.30, frequency:1.20, roas:4.95, cpa:22.58, conversions:32, revenue:3618,
    fatigueStage:1, fatigueScore:9, ctrBaseline:2.34, cpcBaseline:0.50, roasBaseline:5.25,
    trendData: adTrend(2.32, 0.51, 11.9, -0.007, 0.004),
  },

  // Camp 2 — Stage 2 (Early Fatigue)
  {
    id:'ad_004', campaignId:'camp_002', campaignName:'Retargeting 30d Visitors', adSetName:'Website Visitors 30d',
    name:'Retarget — Dynamic Product', status:'ACTIVE', creativeType:'CAROUSEL',
    gradientFrom:'#f59e0b', gradientTo:'#f97316',
    spend:650, impressions:32500, reach:24800, clicks:585, landingPageViews:498,
    cpc:1.11, cpm:20.00, ctr:1.80, frequency:1.31, roas:3.90, cpa:30.48, conversions:21, revenue:2535,
    fatigueStage:2, fatigueScore:26, ctrBaseline:2.25, cpcBaseline:0.84, roasBaseline:4.55,
    trendData: adTrend(2.10, 0.88, 18.5, -0.050, 0.035),
  },
  {
    id:'ad_005', campaignId:'camp_002', campaignName:'Retargeting 30d Visitors', adSetName:'Website Visitors 30d',
    name:'Retarget — Social Proof', status:'ACTIVE', creativeType:'IMAGE',
    gradientFrom:'#a78bfa', gradientTo:'#f59e0b',
    spend:680, impressions:34000, reach:25900, clicks:612, landingPageViews:522,
    cpc:1.11, cpm:20.00, ctr:1.80, frequency:1.31, roas:3.75, cpa:31.88, conversions:21, revenue:2550,
    fatigueStage:2, fatigueScore:29, ctrBaseline:2.20, cpcBaseline:0.86, roasBaseline:4.45,
    trendData: adTrend(2.05, 0.90, 18.8, -0.052, 0.038),
  },
  {
    id:'ad_006', campaignId:'camp_002', campaignName:'Retargeting 30d Visitors', adSetName:'Website Visitors 30d',
    name:'Retarget — Testimonial Video', status:'ACTIVE', creativeType:'VIDEO',
    gradientFrom:'#38bdf8', gradientTo:'#a78bfa',
    spend:560, impressions:28000, reach:21300, clicks:504, landingPageViews:429,
    cpc:1.11, cpm:20.00, ctr:1.80, frequency:1.31, roas:3.72, cpa:31.11, conversions:18, revenue:2083,
    fatigueStage:2, fatigueScore:31, ctrBaseline:2.18, cpcBaseline:0.88, roasBaseline:4.40,
    trendData: adTrend(2.02, 0.91, 19.0, -0.055, 0.040),
  },

  // Camp 3 — Stage 2 (Early Fatigue)
  {
    id:'ad_007', campaignId:'camp_003', campaignName:'Lookalike 1% — Top Buyers', adSetName:'LAL 1% US',
    name:'LAL — Before/After Creative', status:'ACTIVE', creativeType:'IMAGE',
    gradientFrom:'#10b981', gradientTo:'#f59e0b',
    spend:980, impressions:50800, reach:33600, clicks:914, landingPageViews:756,
    cpc:1.07, cpm:19.29, ctr:1.80, frequency:1.51, roas:3.30, cpa:34.45, conversions:28, revenue:3234,
    fatigueStage:2, fatigueScore:32, ctrBaseline:2.18, cpcBaseline:0.80, roasBaseline:4.15,
    trendData: adTrend(2.08, 0.83, 17.8, -0.048, 0.038),
  },
  {
    id:'ad_008', campaignId:'camp_003', campaignName:'Lookalike 1% — Top Buyers', adSetName:'LAL 1% US',
    name:'LAL — Lifestyle Video 30s', status:'ACTIVE', creativeType:'VIDEO',
    gradientFrom:'#6366f1', gradientTo:'#10b981',
    spend:1040, impressions:53900, reach:35700, clicks:970, landingPageViews:810,
    cpc:1.07, cpm:19.30, ctr:1.80, frequency:1.51, roas:3.15, cpa:36.14, conversions:28, revenue:3276,
    fatigueStage:2, fatigueScore:36, ctrBaseline:2.15, cpcBaseline:0.82, roasBaseline:4.05,
    trendData: adTrend(2.05, 0.84, 18.0, -0.050, 0.040),
  },
  {
    id:'ad_009', campaignId:'camp_003', campaignName:'Lookalike 1% — Top Buyers', adSetName:'LAL 2% US',
    name:'LAL — Carousel Benefits', status:'ACTIVE', creativeType:'CAROUSEL',
    gradientFrom:'#f97316', gradientTo:'#6366f1',
    spend:840, impressions:43300, reach:28700, clicks:780, landingPageViews:640,
    cpc:1.08, cpm:19.42, ctr:1.80, frequency:1.51, roas:3.15, cpa:36.00, conversions:23, revenue:2646,
    fatigueStage:2, fatigueScore:35, ctrBaseline:2.12, cpcBaseline:0.83, roasBaseline:4.10,
    trendData: adTrend(2.04, 0.85, 18.2, -0.051, 0.041),
  },

  // Camp 4 — Stage 3 (Confirmed Fatigue)
  {
    id:'ad_010', campaignId:'camp_004', campaignName:'Interest Stack — Fitness Audience', adSetName:'Fitness Interest US',
    name:'Fitness — Pain Point Hook', status:'ACTIVE', creativeType:'VIDEO',
    gradientFrom:'#f97316', gradientTo:'#ef4444',
    spend:750, impressions:25700, reach:14600, clicks:231, landingPageViews:165,
    cpc:3.25, cpm:29.18, ctr:0.90, frequency:1.76, roas:1.85, cpa:62.50, conversions:12, revenue:1388,
    fatigueStage:3, fatigueScore:60, ctrBaseline:2.22, cpcBaseline:0.90, roasBaseline:4.25,
    trendData: adTrend(1.35, 2.10, 25.5, -0.070, 0.160),
  },
  {
    id:'ad_011', campaignId:'camp_004', campaignName:'Interest Stack — Fitness Audience', adSetName:'Fitness Interest US',
    name:'Fitness — Transformation Carousel', status:'ACTIVE', creativeType:'CAROUSEL',
    gradientFrom:'#ef4444', gradientTo:'#a78bfa',
    spend:780, impressions:26700, reach:15200, clicks:240, landingPageViews:172,
    cpc:3.25, cpm:29.21, ctr:0.90, frequency:1.76, roas:1.78, cpa:65.00, conversions:12, revenue:1388,
    fatigueStage:3, fatigueScore:65, ctrBaseline:2.18, cpcBaseline:0.92, roasBaseline:4.18,
    trendData: adTrend(1.32, 2.15, 25.8, -0.072, 0.165),
  },
  {
    id:'ad_012', campaignId:'camp_004', campaignName:'Interest Stack — Fitness Audience', adSetName:'Health Lifestyle US',
    name:'Fitness — Static Offer', status:'ACTIVE', creativeType:'IMAGE',
    gradientFrom:'#a78bfa', gradientTo:'#ef4444',
    spend:630, impressions:21600, reach:12200, clicks:194, landingPageViews:135,
    cpc:3.25, cpm:29.17, ctr:0.90, frequency:1.77, roas:1.77, cpa:66.32, conversions:9, revenue:1114,
    fatigueStage:3, fatigueScore:63, ctrBaseline:2.20, cpcBaseline:0.91, roasBaseline:4.20,
    trendData: adTrend(1.30, 2.18, 25.6, -0.073, 0.168),
  },

  // Camp 5 — Stage 4 (Obvious Fatigue)
  {
    id:'ad_013', campaignId:'camp_005', campaignName:'Broad Auto DABA', adSetName:'Broad All Interests',
    name:'DABA — Product Collection A', status:'ACTIVE', creativeType:'CAROUSEL',
    gradientFrom:'#ef4444', gradientTo:'#7f1d1d',
    spend:490, impressions:13900, reach:4750, clicks:56,  landingPageViews:32,
    cpc:8.75, cpm:35.25, ctr:0.40, frequency:2.93, roas:0.82, cpa:157.0, conversions:3, revenue:402,
    fatigueStage:4, fatigueScore:86, ctrBaseline:2.12, cpcBaseline:0.87, roasBaseline:4.02,
    trendData: adTrend(0.72, 6.50, 31.2, -0.042, 0.380),
  },
  {
    id:'ad_014', campaignId:'camp_005', campaignName:'Broad Auto DABA', adSetName:'Broad All Interests',
    name:'DABA — Product Collection B', status:'ACTIVE', creativeType:'CAROUSEL',
    gradientFrom:'#7c3aed', gradientTo:'#ef4444',
    spend:520, impressions:14800, reach:5060, clicks:59,  landingPageViews:34,
    cpc:8.81, cpm:35.14, ctr:0.40, frequency:2.93, roas:0.79, cpa:162.5, conversions:3, revenue:411,
    fatigueStage:4, fatigueScore:89, ctrBaseline:2.10, cpcBaseline:0.88, roasBaseline:3.98,
    trendData: adTrend(0.70, 6.60, 31.5, -0.044, 0.390),
  },
  {
    id:'ad_015', campaignId:'camp_005', campaignName:'Broad Auto DABA', adSetName:'Broad All Interests',
    name:'DABA — Single Image Offer', status:'ACTIVE', creativeType:'IMAGE',
    gradientFrom:'#991b1b', gradientTo:'#7c3aed',
    spend:430, impressions:12300, reach:4190, clicks:49,  landingPageViews:28,
    cpc:8.78, cpm:34.96, ctr:0.40, frequency:2.94, roas:0.78, cpa:164.2, conversions:3, revenue:335,
    fatigueStage:4, fatigueScore:91, ctrBaseline:2.08, cpcBaseline:0.89, roasBaseline:3.96,
    trendData: adTrend(0.68, 6.70, 31.0, -0.046, 0.400),
  },
];

// ─── Fatigue Curve (45-day lifecycle, normalized % change from Day 1) ─────────

function buildFatigueCurve(): FatigueCurvePoint[] {
  const pts: FatigueCurvePoint[] = [];
  for (let i = 0; i < 45; i++) {
    const d = i + 1;

    let freqR: number, ctrR: number, cpcR: number, cpaR: number, roasR: number;

    if (d <= 10) {
      freqR = 1.0 + (d - 1) * 0.10;
      ctrR  = 2.00;
      cpcR  = 0.60;
      cpaR  = 30.0;
      roasR = 4.00;
    } else if (d <= 20) {
      freqR = 1.9  + (d - 10) * 0.12;
      ctrR  = 2.00 - (d - 10) * 0.042;
      cpcR  = 0.60 + (d - 10) * 0.025;
      cpaR  = 30.0 + (d - 12) * 1.00;
      roasR = 4.00 - (d - 12) * 0.075;
    } else if (d <= 32) {
      freqR = 3.1  + (d - 20) * 0.15;
      ctrR  = 1.58 - (d - 20) * 0.058;
      cpcR  = 0.85 + (d - 20) * 0.096;
      cpaR  = 38.0 + (d - 20) * 2.67;
      roasR = 3.40 - (d - 20) * 0.117;
    } else {
      freqR = 4.9  + (d - 32) * 0.192;
      ctrR  = 0.88 - (d - 32) * 0.046;
      cpcR  = 2.00 + (d - 32) * 0.231;
      cpaR  = 70.0 + (d - 32) * 6.15;
      roasR = 2.00 - (d - 32) * 0.100;
    }

    ctrR  = Math.max(0.05, ctrR);
    roasR = Math.max(0.20, roasR);

    pts.push({
      day: d,
      stage: d <= 10 ? 1 : d <= 20 ? 2 : d <= 32 ? 3 : 4,
      frequency: Math.round(((freqR  - 1.0)  / 1.0  * 100) * 10) / 10,
      ctr:       Math.round(((ctrR   - 2.0)  / 2.0  * 100) * 10) / 10,
      cpc:       Math.round(((cpcR   - 0.60) / 0.60 * 100) * 10) / 10,
      cpa:       Math.round(((cpaR   - 30.0) / 30.0 * 100) * 10) / 10,
      roas:      Math.round(((roasR  - 4.0)  / 4.0  * 100) * 10) / 10,
      freqRaw:   Math.round(freqR  * 10) / 10,
      ctrRaw:    Math.round(ctrR   * 100) / 100,
      cpcRaw:    Math.round(cpcR   * 100) / 100,
      cpaRaw:    Math.round(cpaR   * 10)  / 10,
      roasRaw:   Math.round(roasR  * 100) / 100,
    });
  }
  return pts;
}

export const MOCK_FATIGUE_CURVE = buildFatigueCurve();

// ─── CPM Trend (per campaign, 30 days) ───────────────────────────────────────

export const MOCK_CPM_TREND = MOCK_DAILY_INSIGHTS.map((d, i) => ({
  date:  d.date,
  camp1: Math.round((11.4  + i * 0.02) * 100) / 100,
  camp2: Math.round((18.8  + i * 0.05) * 100) / 100,
  camp3: Math.round((18.5  + i * 0.04) * 100) / 100,
  camp4: Math.round((25.0  + i * 0.20) * 100) / 100,
  camp5: Math.round((31.0  + i * 0.18) * 100) / 100,
}));

// ─── Frequency Heatmap (15 ads × 14 days) ────────────────────────────────────

const HM_DATES = MOCK_DAILY_INSIGHTS.slice(-14).map(d => d.date);

export const MOCK_HEATMAP = MOCK_ADS.map(ad => ({
  adId:   ad.id,
  adName: ad.name.slice(0, 28),
  stage:  ad.fatigueStage,
  values: HM_DATES.map((date, i) => ({
    date,
    frequency: Math.round((ad.frequency + (i * (ad.fatigueStage * 0.04))) * 100) / 100,
  })),
}));
