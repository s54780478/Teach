'use client';

import React, { useMemo } from 'react';
import { Gift, Monitor, MapPin, X } from 'lucide-react';
import { SUBJECT_QUICK_FILTERS } from '@/data/filterOptions';
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

/** Superprof 式淺色頂部篩選列 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory: _activeCategory,
  setActiveCategory: _setActiveCategory,
  searchSubject,
  setSearchSubject,
  onlyFreeLesson,
  setOnlyFreeLesson,
  mode,
  setMode,
  sortBy,
  setSortBy,
  availableSubjectQueries = null,
  onClearAll,
  hasActiveFilters = false,
}) => {
  void _activeCategory;
  void _setActiveCategory;

  const subjectChips = useMemo(() => {
    return SUBJECT_QUICK_FILTERS.filter(
      (s) => s.id === 'all' || !availableSubjectQueries || availableSubjectQueries.has(s.id)
    );
  }, [availableSubjectQueries]);

  const activeSubjectChip =
    subjectChips.find((s) => s.id !== 'all' && searchSubject.trim() === s.id)?.id || 'all';

  return (
    <div
      className="border-y border-black/[0.06] bg-white/95 backdrop-blur-md sticky top-14 sm:top-16 z-30"
      role="region"
      aria-label="課程篩選"
    >
      <div className="max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] p-1">
            {MODE_CHIPS.map((chip) => {
              const active = mode === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setMode(chip.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition cursor-pointer ${
                    active
                      ? 'bg-white text-[#1d1d1f] font-semibold shadow-sm'
                      : 'text-[#424245] hover:text-[#1d1d1f]'
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
                ? 'bg-brand-50 border-brand-200 text-brand-600 font-semibold'
                : 'bg-white border-black/10 text-[#424245] hover:border-black/20 hover:text-[#1d1d1f]'
            }`}
          >
            <Gift className="w-3 h-3" />
            第一堂課免費
          </button>

          <label className="ml-auto inline-flex items-center gap-2 text-[12px] text-[#424245]">
            <span className="hidden sm:inline">排序</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as AdvancedFilterValues['sortBy'])
              }
              aria-label="排序方式"
              className="bg-white border border-black/10 rounded-full px-3 py-1.5 text-xs text-[#1d1d1f] font-medium focus:outline-none cursor-pointer"
            >
              <option value="recommended">推薦</option>
              <option value="rating">評價最高</option>
              <option value="price-asc">時薪：低到高</option>
              <option value="price-desc">時薪：高到低</option>
            </select>
          </label>

          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] px-2 py-1.5 cursor-pointer"
              aria-label="清除篩選"
            >
              <X className="w-3 h-3" />
              清除
            </button>
          )}
        </div>

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
                    ? 'bg-[#1d1d1f] text-white font-semibold'
                    : 'bg-[#f5f5f7] text-[#424245] hover:bg-[#ebebed] hover:text-[#1d1d1f]'
                }`}
              >
                {subject.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
