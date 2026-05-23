'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLang } from '@/components/providers/LangProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  LayoutDashboard, TrendingUp, Users, BarChart3, Layers,
  Zap, Palette, Flame, PieChart, Activity, Grid3x3, Lightbulb,
  RefreshCw, ChevronRight, Sun, Moon,
} from 'lucide-react';

type DateRange = 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d';

interface SidebarProps {
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Sidebar({ range, onRangeChange, onRefresh, isRefreshing }: SidebarProps) {
  const { t, lang, toggleLang } = useLang();
  const { theme, toggleTheme }  = useTheme();
  const [active, setActive]     = useState('kpis');
  const [collapsed, setCollapsed] = useState(false);

  const RANGES: { value: DateRange; label: string }[] = [
    { value: 'last_7d',  label: t.last7d  },
    { value: 'last_14d', label: t.last14d },
    { value: 'last_30d', label: t.last30d },
    { value: 'last_90d', label: t.last90d },
  ];

  const NAV = [
    { id: 'kpis',        label: t.navKpis,      icon: LayoutDashboard },
    { id: 'spend',       label: t.navSpend,     icon: TrendingUp },
    { id: 'roas-cpa',    label: t.navRoas,      icon: Activity },
    { id: 'reach',       label: t.navReach,     icon: Users },
    { id: 'campaigns',   label: t.navCampaigns, icon: BarChart3 },
    { id: 'bubble',      label: t.navBubble,    icon: Layers },
    { id: 'ads',         label: t.navAds,       icon: Palette },
    { id: 'fatigue',     label: t.navFatigue,   icon: Flame },
    { id: 'donut',       label: t.navDonut,     icon: PieChart },
    { id: 'cpm-trend',   label: t.navCpm,       icon: Zap },
    { id: 'heatmap',     label: t.navHeatmap,   icon: Grid3x3 },
    { id: 'next-steps',  label: t.navNextSteps, icon: Lightbulb },
  ];

  useEffect(() => {
    const els = NAV.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) {
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          );
          setActive((top.target as HTMLElement).id);
        }
      },
      { threshold: 0.2, rootMargin: '-10% 0px -70% 0px' },
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--bg-card)] transition-all duration-200 z-20 shrink-0',
        collapsed ? 'w-14' : 'w-52',
      )}
    >
      {/* Logo + collapse + lang toggle */}
      <div className="flex items-center gap-1.5 px-3 py-4 border-b border-[var(--border)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-slate-100 tracking-tight truncate flex-1 min-w-0">
            {t.appName}
          </span>
        )}
        {collapsed && <div className="flex-1" />}
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
          className={cn(
            'text-[0.65rem] font-bold px-1.5 py-0.5 rounded border transition-colors',
            'border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white',
            collapsed ? 'mx-auto mt-1' : 'shrink-0',
          )}
        >
          {lang === 'en' ? 'ع' : 'EN'}
        </button>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            'rounded p-1 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]',
            collapsed ? 'mx-auto mt-1' : 'shrink-0',
          )}
        >
          {theme === 'dark'
            ? <Sun className="w-3.5 h-3.5" />
            : <Moon className="w-3.5 h-3.5" />
          }
        </button>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-[var(--text-muted)] hover:text-slate-300 transition-colors shrink-0"
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-180')} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-[var(--text-muted)] hover:text-slate-300 transition-colors mx-auto mt-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Date range */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-[var(--border)]">
          <p className="section-title mb-2 px-1">{t.dateRange}</p>
          <div className="grid grid-cols-2 gap-1">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => onRangeChange(r.value)}
                className={cn(
                  'text-xs py-1.5 px-2 rounded-md font-medium transition-all',
                  range === r.value
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-slate-300',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {!collapsed && (
          <p className="section-title px-2 mb-2">{t.sections}</p>
        )}
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all mb-0.5',
                active === item.id
                  ? 'bg-[var(--accent-glow)] text-[var(--accent)] font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-slate-300',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Refresh */}
      <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all',
            'bg-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-slate-300',
            isRefreshing && 'opacity-60 cursor-not-allowed',
          )}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          {!collapsed && (isRefreshing ? t.refreshing : t.refresh)}
        </button>
      </div>
    </aside>
  );
}

