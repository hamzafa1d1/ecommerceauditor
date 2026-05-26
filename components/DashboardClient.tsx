'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { ActionCenter } from '@/components/sections/ActionCenter';
import { KpiRow } from '@/components/sections/KpiRow';
import { SpendPacingChart } from '@/components/sections/SpendPacingChart';
import { RoasCpaChart } from '@/components/sections/RoasCpaChart';
import { ReachImpressionsChart } from '@/components/sections/ReachImpressionsChart';
import { CampaignTable } from '@/components/sections/CampaignTable';
import { BubbleChart } from '@/components/sections/BubbleChart';
import { AdsGrid } from '@/components/sections/AdsGrid';
import { FatigueCurveChart } from '@/components/sections/FatigueCurveChart';
import { FatigueDonut } from '@/components/sections/FatigueDonut';
import { CpmTrendChart } from '@/components/sections/CpmTrendChart';
import { FrequencyHeatmap } from '@/components/sections/FrequencyHeatmap';
import { useLang } from '@/components/providers/LangProvider';
import { buildActions } from '@/lib/actions-engine';
import type { ActionTarget } from '@/lib/actions-engine';

type DateRange = 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d';

async function fetchInsights(range: DateRange) {
  const res = await fetch(`/api/insights?range=${range}`);
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}
async function fetchCampaigns() {
  const res = await fetch('/api/campaigns');
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}
async function fetchAds() {
  const res = await fetch('/api/ads');
  if (!res.ok) throw new Error('Failed to fetch ads');
  return res.json();
}

export function DashboardClient() {
  const [range, setRange] = useState<DateRange>('last_30d');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { t } = useLang();

  const insights = useQuery({
    queryKey: ['insights', range],
    queryFn:  () => fetchInsights(range),
  });
  const campaigns = useQuery({
    queryKey: ['campaigns', range],
    queryFn:  fetchCampaigns,
  });
  const ads = useQuery({
    queryKey: ['ads', range],
    queryFn:  fetchAds,
  });

  const isRefreshing = insights.isFetching || campaigns.isFetching || ads.isFetching;

  function handleRefresh() {
    insights.refetch();
    campaigns.refetch();
    ads.refetch();
  }

  const iData    = insights.data;
  const cData    = campaigns.data?.data;
  const adsData  = ads.data?.data;
  const iLoading = insights.isLoading;
  const cLoading = campaigns.isLoading;
  const aLoading = ads.isLoading;

  // Compute action items from current data — pure, memoised
  const actions = useMemo(
    () => buildActions(cData ?? [], adsData ?? []),
    [cData, adsData],
  );

  // Called when user clicks "View metrics" on an action card
  const handleActionClick = useCallback((id: string, type: ActionTarget) => {
    setHighlightedId(id);
    const sectionId = type === 'campaign' ? 'campaigns' : 'ads';
    // Small timeout lets state propagate before scrolling so the row is visible
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    // Auto-clear highlight after 4 seconds
    setTimeout(() => setHighlightedId(null), 4000);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      <Sidebar
        range={range}
        onRangeChange={setRange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-base)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[var(--text-primary)]">{t.appTitle}</h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">
              {t.appSubtitle}
              {iData?.source === 'mock' && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {t.demoData}
                </span>
              )}
            </p>
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">
            {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
          </div>
        </div>

        {/* All sections */}
        <div className="px-6 py-5 space-y-5 max-w-[1400px]">
          <ActionCenter
            actions={actions}
            onActionClick={handleActionClick}
          />
          <KpiRow
            current={iData?.kpiCurrent}
            prev={iData?.kpiPrev}
            isLoading={iLoading}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <SpendPacingChart
              data={iData?.daily}
              isLoading={iLoading}
            />
            <RoasCpaChart
              data={iData?.daily}
              isLoading={iLoading}
            />
          </div>
          <ReachImpressionsChart
            data={iData?.daily}
            isLoading={iLoading}
          />
          <CampaignTable
            data={cData}
            isLoading={cLoading}
            highlightedId={highlightedId}
          />
          <BubbleChart
            data={cData}
            isLoading={cLoading}
          />
          <AdsGrid
            data={adsData}
            isLoading={aLoading}
            highlightedId={highlightedId}
          />
          <FatigueCurveChart
            data={iData?.fatigueCurve}
            isLoading={iLoading}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <FatigueDonut
              ads={adsData}
              isLoading={aLoading}
            />
            <CpmTrendChart
              data={iData?.cpmTrend}
              isLoading={iLoading}
            />
          </div>
          <FrequencyHeatmap
            data={iData?.heatmap}
            isLoading={iLoading}
          />

          {/* Footer */}
          <div className="pb-6 text-center text-[0.6rem] text-[var(--text-dim)]">
              {t.footer}
          </div>
        </div>
      </main>
    </div>
  );
}
