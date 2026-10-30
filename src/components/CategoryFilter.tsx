'use client';

import React, { useMemo } from 'react';
import { Gift, Monitor, MapPin, X } from 'lucide-react';
import {
  SUBJECT_QUICK_FILTERS,
  SUBJECT_CATEGORIES,
} from '@/data/filterOptions';
import type { AdvancedFilterValues } from '@/components/AdvancedFilterPanel';

interface CategoryFilterProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchSubject: string;
  setSearchSubject: (val: string) => void;
  onlyFreeLesson: boolean;
  setOnlyFreeLesson: (val: boolean) => void;
  mode: AdvancedFilterValues['mode'];
  setMode: (mode: AdvancedFilterValues['mode']) => void;
  sortBy: AdvancedFilterValues['sortBy'];
  setSortBy: (sort: AdvancedFilterValues['sortBy']) => void;
  availableSubjectQueries?: Set<string> | null;
  availableCategories?: Set<string> | null;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

const MODE_CHIPS: { id: AdvancedFilterValues['mode']; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'online', label: '線上' },
  { id: 'in-person', label: '面授' },
];

/**
 * Superprof 式頂部單一篩選列（Top Filter Bar）
 * — 不含側邊欄；授課方式／首堂免費／排序／科目整合於此
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  setActiveCategory,
  searchSubject,
  setSearchSubject,
  onlyFreeLesson,
  setOnlyFreeLesson,
  mode,
  setMode,
  sortBy,
  setSortBy,
  availableSubjectQueries = null,
  availableCategories = null,
  onClearAll,
  hasActiveFilters = false,
}) => {
  const subjectChips = useMemo(() => {
    return SUBJECT_QUICK_FILTERS.filter(
      (s) => s.id === 'all' || !availableSubjectQueries || availableSubjectQueries.has(s.id)
    );
  }, [availableSubjectQueries]);

  const categoryChips = useMemo(() => {
    return SUBJECT_CATEGORIES.filter(
      (c) => c.id === 'all' || !availableCategories || availableCategories.has(c.id)
    );
  }, [availableCategories]);

  const activeSubjectChip =
    subjectChips.find((s) => s.id !== 'all' && searchSubject.trim() === s.id)?.id || 'all';

  return (
    <div
      className="border-y border-white/5 bg-[#0c0c0e]/95 backdrop-blur-xl sticky top-0 z-30"
      role="region"
      aria-label="課程篩選"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
        {/* 單一頂部列：授課方式 · 首堂免費 · 排序 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/10 p-1">
            {MODE_CHIPS.map((chip) => {
              const active = mode === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setMode(chip.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 font-semibold'
                      : 'text-white/65 hover:text-white'
                  }`}
                >
                  {chip.id === 'online' && <Monitor className="w-3 h-3" />}
                  {chip.id === 'in-person' && <MapPin className="w-3 h-3" />}
                  {chip.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOnlyFreeLesson(!onlyFreeLesson)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border cursor-pointer ${
              onlyFreeLesson
                ? 'bg-brand-500/15 border-brand-500/40 text-brand-500 font-semibold'
                : 'bg-transparent border-white/15 text-white/65 hover:border-white/30'
            }`}
          >
            <Gift className="w-3 h-3" />
            第一堂課免費
          </button>

          <label className="ml-auto inline-flex items-center gap-2 text-[11px] text-white/40">
            <span className="hidden sm:inline">排序</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as AdvancedFilterValues['sortBy'])
              }
              aria-label="排序方式"
              className="bg-white/5 border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/85 font-medium focus:outline-none cursor-pointer"
            >
              <option value="recommended" className="text-slate-900">
                推薦
              </option>
              <option value="rating" className="text-slate-900">
                評價最高
              </option>
              <option value="price-asc" className="text-slate-900">
                時薪：低到高
              </option>
              <option value="price-desc" className="text-slate-900">
                時薪：高到低
              </option>
            </select>
          </label>

          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[11px] text-white/45 hover:text-white px-2 py-1.5 cursor-pointer"
              aria-label="清除篩選"
            >
              <X className="w-3 h-3" />
              清除
            </button>
          )}
        </div>

        {/* 科目快捷（同一頂部區塊內，不另開側欄） */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {subjectChips.map((subject) => {
            const isActive = activeSubjectChip === subject.id;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSearchSubject(subject.id === 'all' ? '' : subject.id)}
                className={`px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold'
                    : 'bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                {subject.label}
              </button>
            );
          })}
        </div>

        {categoryChips.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {categoryChips.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-500 border-brand-500/35 font-semibold'
                      : 'bg-transparent text-white/45 border-white/10 hover:border-white/25'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
