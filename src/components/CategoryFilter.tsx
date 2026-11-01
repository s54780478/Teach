'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Gift, Monitor, MapPin, Loader2 } from 'lucide-react';
import { SUBJECT_CATEGORIES } from '@/data/filterOptions';
import {
  SORT_OPTIONS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import type { MainCategoryKey } from '@/types/mainCategory';
import { isMainCategoryKey } from '@/types/mainCategory';
import {
  fetchPopularTagsWithFallback,
  type PopularTagItem,
} from '@/lib/fetchPopularTags';
import {
  buildTutorsCategoryPath,
  buildTutorsPathForTag,
  buildTutorsTagPath,
} from '@/lib/tutorTagRoutes';

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
  /** 首頁 Hero 已有大類圖示時隱藏重複的一級分類列 */
  hideMainCategoryTabs?: boolean;
  /**
   * URL 綁定頁：保留網址上的 tag（即使不在熱門 pills），
   * 且換大類時不額外呼叫 setSearchSubject（避免雙重 router.push 卡住）
   */
  urlBound?: boolean;
}

const MODE_CHIPS: { id: AdvancedFilterValues['mode']; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'online', label: '線上' },
  { id: 'in-person', label: '面授' },
];

/**
 * 第一層：固定 8 大分類 + 全部
 * 第二層：僅該大類熱門 tags（不回退全站，避免互斥篩成 0 筆）
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
  hideMainCategoryTabs = false,
  urlBound = false,
}) => {
  const categoryChips = useMemo(() => SUBJECT_CATEGORIES, []);
  const [popularTags, setPopularTags] = useState<PopularTagItem[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  /** 擋掉過期 tags 回應（全站熱門寫進「個人成長」） */
  const tagsGenRef = useRef(0);

  useEffect(() => {
    const gen = ++tagsGenRef.current;
    const controller = new AbortController();
    const main =
      activeCategory !== 'all' && isMainCategoryKey(activeCategory)
        ? activeCategory
        : '';

    // 換大類立刻清空舊 pills，避免殘留「國中數學／音樂」可點
    setPopularTags([]);
    setTagsLoading(true);

    const timer = window.setTimeout(() => {
      void fetchPopularTagsWithFallback(main, { signal: controller.signal })
        .then((result) => {
          if (gen !== tagsGenRef.current) return;
          setPopularTags(result.tags);
        })
        .catch(() => {
          if (gen !== tagsGenRef.current) return;
          setPopularTags([]);
        })
        .finally(() => {
          if (gen === tagsGenRef.current) setTagsLoading(false);
        });
    }, 80);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeCategory]);

  // 首頁：殘留關鍵字若不在本類 pills → 清掉
  // URL 綁定頁：保留網址 tag，避免被自動清掉後二次導航
  useEffect(() => {
    if (urlBound) return;
    if (tagsLoading) return;
    const q = searchSubject.trim();
    if (!q || activeCategory === 'all') return;
    if (popularTags.length === 0) return;
    if (!popularTags.some((t) => t.tag === q)) {
      setSearchSubject('');
    }
  }, [
    urlBound,
    tagsLoading,
    popularTags,
    searchSubject,
    activeCategory,
    setSearchSubject,
  ]);

  const activeTag =
    popularTags.find((t) => searchSubject.trim() === t.tag)?.tag ||
    (searchSubject.trim() ? searchSubject.trim() : '');

  /** URL 上的 tag 若不在熱門列，仍插入一顆供 Selected 顯示 */
  const displayTags = useMemo(() => {
    const q = searchSubject.trim();
    if (!q || popularTags.some((t) => t.tag === q)) return popularTags;
    return [{ tag: q, count: 0 }, ...popularTags];
  }, [popularTags, searchSubject]);

  const handleSelectCategory = (catId: string) => {
    // URL 綁定：改走 <Link>，此處僅非 URL 模式使用
    if (urlBound) return;
    tagsGenRef.current += 1;
    setPopularTags([]);
    setTagsLoading(true);
    setActiveCategory(catId);
    setSearchSubject('');
  };

  const categoryHref = (catId: string): string => {
    if (catId === 'all') return '/';
    if (isMainCategoryKey(catId)) return buildTutorsCategoryPath(catId);
    return '/';
  };

  const tagHref = (
    tagValue: string,
    tagMain?: MainCategoryKey
  ): string | null => {
    if (!tagValue.trim()) {
      if (isMainCategoryKey(activeCategory)) {
        return buildTutorsCategoryPath(activeCategory);
      }
      // 全部分類清標籤 → 回首頁
      return '/';
    }
    if (isMainCategoryKey(activeCategory)) {
      return buildTutorsTagPath(activeCategory, tagValue);
    }
    // 全部分類：導向該 tag 所屬大類網址
    return buildTutorsPathForTag(tagValue, tagMain || null);
  };

  const chipClass = (active: boolean, variant: 'category' | 'tag') => {
    if (variant === 'category') {
      return `px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-brand-500 text-white font-semibold'
          : 'bg-white text-[#424245] border border-black/10 hover:border-black/20'
      }`;
    }
    return `px-3 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
      active
        ? 'bg-[#1d1d1f] text-white font-semibold'
        : 'bg-[#f5f5f7] text-[#424245] hover:bg-[#ebebed] hover:text-[#1d1d1f]'
    }`;
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
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!hideMainCategoryTabs && (
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-none"
            role="tablist"
            aria-label="一級分類"
          >
            {categoryChips.map((cat) => {
              const isActive = activeCategory === cat.id;
              const className = chipClass(isActive, 'category');
              // 已選中再點：不要導航／捲到頂（尤其首頁「全部分類」→ `/`）
              if (urlBound && isActive) {
                return (
                  <span
                    key={cat.id}
                    role="tab"
                    aria-selected
                    className={className}
                  >
                    {cat.label}
                  </span>
                );
              }
              if (urlBound) {
                return (
                  <Link
                    key={cat.id}
                    href={categoryHref(cat.id)}
                    role="tab"
                    aria-selected={false}
                    className={className}
                  >
                    {cat.label}
                  </Link>
                );
              }
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={className}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {showTagRow && (
          <div
            className="flex items-center gap-2 overflow-x-auto scrollbar-none min-h-[34px]"
            role="listbox"
            aria-label="熱門標籤"
            aria-busy={tagsLoading}
          >
            {tagsLoading ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#86868b] px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                載入熱門標籤…
              </span>
            ) : (
              <>
                {urlBound && !activeTag ? (
                  // 已在「全部標籤」：再點不要導向 `/` 把畫面拉回頂部
                  <span
                    role="option"
                    aria-selected
                    className={chipClass(true, 'tag')}
                  >
                    全部標籤
                  </span>
                ) : urlBound ? (
                  <Link
                    href={
                      isMainCategoryKey(activeCategory)
                        ? buildTutorsCategoryPath(activeCategory)
                        : '/'
                    }
                    scroll={false}
                    className={chipClass(false, 'tag')}
                  >
                    全部標籤
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchSubject('')}
                    className={chipClass(!activeTag, 'tag')}
                  >
                    全部標籤
                  </button>
                )}
                {displayTags.map((item) => {
                  const isActive = activeTag === item.tag;
                  const href = urlBound
                    ? tagHref(
                        isActive ? '' : item.tag,
                        item.mainCategory
                      )
                    : null;
                  const title =
                    item.count > 0
                      ? `${item.tag}（${item.count}）`
                      : item.tag;
                  const className = chipClass(isActive, 'tag');
                  if (href) {
                    // 點已選 tag 清回大類／首頁：不捲頂；點新 tag 進新頁則預設捲頂
                    const clearing = isActive;
                    return (
                      <Link
                        key={item.tag}
                        href={href}
                        scroll={!clearing}
                        role="option"
                        aria-selected={isActive}
                        title={title}
                        className={className}
                      >
                        {item.tag}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      title={title}
                      onClick={() =>
                        setSearchSubject(isActive ? '' : item.tag)
                      }
                      className={className}
                    >
                      {item.tag}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
