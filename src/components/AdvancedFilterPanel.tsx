'use client';

import React, { useEffect, useState } from 'react';
import { Filter, Monitor, Users, X } from 'lucide-react';
import type { TutorSearchFilters } from '@/lib/tutorService';

export type AdvancedFilterValues = {
  minRate: number | '';
  maxRate: number | '';
  mode: NonNullable<TutorSearchFilters['mode']>;
  sortBy: NonNullable<TutorSearchFilters['sortBy']>;
};

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterValues = {
  minRate: '',
  maxRate: '',
  mode: 'all',
  sortBy: 'recommended',
};

interface AdvancedFilterPanelProps {
  value: AdvancedFilterValues;
  onChange: (next: AdvancedFilterValues) => void;
  variant?: 'dark' | 'light';
  layout?: 'full' | 'trigger-only' | 'sidebar-only';
  className?: string;
}

const MODE_OPTIONS: {
  value: AdvancedFilterValues['mode'];
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'all', label: '不限', icon: null },
  { value: 'online', label: '線上教學', icon: <Monitor className="w-3.5 h-3.5" /> },
  { value: 'in-person', label: '面對面授課', icon: <Users className="w-3.5 h-3.5" /> },
];

export const SORT_OPTIONS: { value: AdvancedFilterValues['sortBy']; label: string }[] = [
  { value: 'recommended', label: '精選推薦' },
  { value: 'rating', label: '最佳評分' },
  { value: 'popularity', label: '熱門程度' },
  { value: 'reviews', label: '評論數量' },
  { value: 'price-asc', label: '時薪：低到高' },
  { value: 'price-desc', label: '時薪：高到低' },
];

function FilterFields({
  value,
  onChange,
  variant,
}: {
  value: AdvancedFilterValues;
  onChange: (next: AdvancedFilterValues) => void;
  variant: 'dark' | 'light';
}) {
  const isDark = variant === 'dark';
  const labelCls = isDark ? 'text-white/45' : 'text-slate-500';
  const inputCls = isDark
    ? 'bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:ring-brand-500/45 focus:border-brand-500/50'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-brand-500/30';
  const chipIdle = isDark
    ? 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20'
    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
  const chipActive = 'bg-brand-500 text-white border-brand-500 font-semibold shadow-md shadow-brand-500/25';

  return (
    <div className="space-y-7">
      <div>
        <p className={`text-[11px] font-bold tracking-wide mb-3 ${labelCls}`}>時薪區間（NT$）</p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-min-rate">
            最低時薪
          </label>
          <input
            id="filter-min-rate"
            type="number"
            min={0}
            step={50}
            placeholder="最低"
            value={value.minRate}
            onChange={(e) =>
              onChange({
                ...value,
                minRate: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${inputCls}`}
          />
          <span className={`text-xs flex-shrink-0 ${labelCls}`}>—</span>
          <label className="sr-only" htmlFor="filter-max-rate">
            最高時薪
          </label>
          <input
            id="filter-max-rate"
            type="number"
            min={0}
            step={50}
            placeholder="最高"
            value={value.maxRate}
            onChange={(e) =>
              onChange({
                ...value,
                maxRate: e.target.value === '' ? '' : Number(e.target.value),
              })
            }
            className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${inputCls}`}
          />
        </div>
      </div>

      <div>
        <p className={`text-[11px] font-bold tracking-wide mb-3 ${labelCls}`}>授課方式</p>
        <div className="flex flex-col gap-2">
          {MODE_OPTIONS.map((opt) => {
            const active = value.mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...value, mode: opt.value })}
                className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm border transition duration-200 cursor-pointer active:scale-[0.98] ${
                  active ? chipActive : chipIdle
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={`text-[11px] font-bold tracking-wide mb-3 ${labelCls}`}>排序方式</p>
        <label htmlFor="filter-sort" className="sr-only">
          排序方式
        </label>
        <select
          id="filter-sort"
          value={value.sortBy}
          onChange={(e) =>
            onChange({
              ...value,
              sortBy: e.target.value as AdvancedFilterValues['sortBy'],
            })
          }
          className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 cursor-pointer ${inputCls}`}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {(value.minRate !== '' ||
        value.maxRate !== '' ||
        value.mode !== 'all' ||
        value.sortBy !== 'recommended') && (
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_ADVANCED_FILTERS })}
          className={`text-xs font-medium underline underline-offset-2 cursor-pointer transition ${
            isDark ? 'text-white/45 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          重設進階篩選
        </button>
      )}
    </div>
  );
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  value,
  onChange,
  variant = 'dark',
  layout = 'full',
  className = '',
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDark = variant === 'dark';
  const showTrigger = layout === 'full' || layout === 'trigger-only';
  const showSidebar = layout === 'full' || layout === 'sidebar-only';

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const activeCount =
    (value.minRate !== '' ? 1 : 0) +
    (value.maxRate !== '' ? 1 : 0) +
    (value.mode !== 'all' ? 1 : 0) +
    (value.sortBy !== 'recommended' ? 1 : 0);

  return (
    <>
      {showTrigger && (
        <div className={`lg:hidden ${className}`}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition duration-200 active:scale-[0.98] cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] border-white/15 text-white hover:bg-white/10 hover:border-white/25'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
            aria-label="開啟進階篩選"
          >
            <Filter className="w-4 h-4" />
            進階篩選
            {activeCount > 0 && (
              <span className="min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-brand-500/40">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      )}

      {showSidebar && (
        <aside
          className={`hidden lg:block w-56 xl:w-64 flex-shrink-0 ${className}`}
          aria-label="進階篩選"
        >
          <div
            className={`sticky top-24 rounded-3xl border p-5 xl:p-6 transition ${
              isDark
                ? 'bg-white/[0.035] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                <Filter className="w-4 h-4 text-brand-500" />
              </span>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                進階篩選
              </h2>
            </div>
            <FilterFields value={value} onChange={onChange} variant={variant} />
          </div>
        </aside>
      )}

      {showTrigger && drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="進階篩選"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer animate-fade-rise"
            aria-label="關閉篩選"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className={`absolute bottom-0 inset-x-0 max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] border-t p-5 pb-9 shadow-2xl animate-drawer-up ${
              isDark ? 'bg-[#141416] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden />
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                進階篩選
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className={`p-2 rounded-xl cursor-pointer transition ${
                  isDark ? 'text-white/60 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
                }`}
                aria-label="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterFields value={value} onChange={onChange} variant={variant} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-7 w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold py-3.5 rounded-full transition shadow-lg shadow-brand-500/25 cursor-pointer"
            >
              套用篩選
            </button>
          </div>
        </div>
      )}
    </>
  );
};
