'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Gift, Monitor, MapPin, X, Loader2 } from 'lucide-react';
import { SUBJECT_CATEGORIES } from '@/data/filterOptions';
import type { AdvancedFilterValues } from '@/components/AdvancedFilterPanel';
import type { MainCategoryKey } from '@/types/mainCategory';
import { isMainCategoryKey } from '@/types/mainCategory';
import {
  fetchPopularTagsWithFallback,
  type PopularTagItem,
} from '@/lib/fetchPopularTags';

interface CategoryFilterProps {
  activeCategory: MainCategoryKey | 'all' | string;
  setActiveCategory: (cat: string) => void;
  searchSubject: string;
  setSearchSubject: (val: string) => void;
  onlyFreeLesson: boolean;
  setOnlyFreeLesson: (val: boolean) => void;
  mode: AdvancedFilterValues['mode'];
  setMode: (mode: AdvancedFilterValues['mode']) => void;
  sortBy: AdvancedFilterValues['sortBy'];
  setSortBy: (sort: AdvancedFilterValues['sortBy']) => void;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

const MODE_CHIPS: { id: AdvancedFilterValues['mode']; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'online', label: '線上' },
  { id: 'in-person', label: '面授' },
];

/**
 * 第一層：固定 8 大分類 + 全部
 * 第二層：Steam 式動態熱門 tags（過少則回退全站；仍空則隱藏）
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
  onClearAll,
  hasActiveFilters = false,
}) => {
  const categoryChips = useMemo(() => SUBJECT_CATEGORIES, []);
  const [popularTags, setPopularTags] = useState<PopularTagItem[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagSource, setTagSource] = useState<'category' | 'site' | 'empty'>('empty');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const main =
      activeCategory !== 'all' && isMainCategoryKey(activeCategory)
        ? activeCategory
        : '';

    setTagsLoading(true);

    const timer = window.setTimeout(() => {
      void fetchPopularTagsWithFallback(main, { signal: controller.signal })
        .then((result) => {
          if (cancelled) return;
          setPopularTags(result.tags);
          setTagSource(result.source);
        })
        .catch(() => {
          if (!cancelled) {
            setPopularTags([]);
            setTagSource('empty');
          }
        })
        .finally(() => {
          if (!cancelled) setTagsLoading(false);
        });
    }, 120);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeCategory]);

  const activeTag =
    popularTags.find((t) => searchSubject.trim() === t.tag)?.tag ||
    (searchSubject.trim() ? searchSubject.trim() : '');

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    setSearchSubject('');
  };

  const showTagRow = tagsLoading || popularTags.length > 0 || Boolean(activeTag);

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

        <div
          className="flex items-center gap-2 overflow-x-auto scrollbar-none"
          role="tablist"
          aria-label="一級分類"
        >
          {categoryChips.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'bg-white text-[#424245] border border-black/10 hover:border-black/20'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {showTagRow && (
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-none min-h-[34px]"
            role="listbox"
            aria-label="熱門標籤"
            aria-busy={tagsLoading}
          >
            {tagsLoading && popularTags.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#86868b] px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                載入熱門標籤…
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSearchSubject('')}
                  className={`px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
                    !activeTag
                      ? 'bg-[#1d1d1f] text-white font-semibold'
                      : 'bg-[#f5f5f7] text-[#424245] hover:bg-[#ebebed] hover:text-[#1d1d1f]'
                  }`}
                >
                  全部標籤
                </button>
                {popularTags.map((item) => {
                  const isActive = activeTag === item.tag;
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      title={`${item.tag}（${item.count}）`}
                      onClick={() =>
                        setSearchSubject(isActive ? '' : item.tag)
                      }
                      className={`px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#1d1d1f] text-white font-semibold'
                          : 'bg-[#f5f5f7] text-[#424245] hover:bg-[#ebebed] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {item.tag}
                    </button>
                  );
                })}
                {!tagsLoading &&
                  tagSource === 'site' &&
                  activeCategory !== 'all' && (
                    <span className="text-[11px] text-[#86868b] whitespace-nowrap px-1">
                      顯示全站熱門
                    </span>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
