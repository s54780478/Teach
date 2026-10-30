'use client';

import React, { useMemo } from 'react';
import { MapPin, BookOpen, X } from 'lucide-react';
import {
  TW_CITIES,
  SUBJECT_QUICK_FILTERS,
  SUBJECT_CATEGORIES,
} from '@/data/filterOptions';

interface CategoryFilterProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  searchSubject: string;
  setSearchSubject: (val: string) => void;
  onlyFreeLesson: boolean;
  setOnlyFreeLesson: (val: boolean) => void;
  sortBy: 'recommended' | 'price-asc' | 'price-desc' | 'rating';
  setSortBy: (sort: 'recommended' | 'price-asc' | 'price-desc' | 'rating') => void;
  /** 有老師資料的科目 id；未傳入時顯示全部 */
  availableSubjectQueries?: Set<string> | null;
  /** 有老師資料的分類 id；未傳入時顯示全部 */
  availableCategories?: Set<string> | null;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  setActiveCategory,
  searchLocation,
  setSearchLocation,
  searchSubject,
  setSearchSubject,
  onlyFreeLesson,
  setOnlyFreeLesson,
  sortBy,
  setSortBy,
  availableSubjectQueries = null,
  availableCategories = null,
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

  const hasActiveFilters =
    Boolean(searchLocation.trim()) ||
    Boolean(searchSubject.trim()) ||
    activeCategory !== 'all' ||
    onlyFreeLesson;

  return (
    <div className="border-y border-white/5 bg-[#0c0c0e]/92 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" aria-hidden />
            <label htmlFor="city-filter" className="sr-only">
              地區篩選
            </label>
            <select
              id="city-filter"
              value={
                (TW_CITIES as readonly string[]).includes(searchLocation.trim())
                  ? searchLocation.trim()
                  : searchLocation.trim()
                    ? '__custom__'
                    : ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') return;
                setSearchLocation(val);
              }}
              aria-label="依縣市篩選導師"
              className="flex-1 min-w-0 max-w-xs bg-white/[0.06] border border-white/15 rounded-full px-3.5 py-2 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-brand-500/35 cursor-pointer transition"
            >
              <option value="" className="text-slate-900">
                全台地區
              </option>
              {TW_CITIES.map((city) => (
                <option key={city} value={city} className="text-slate-900">
                  {city}
                </option>
              ))}
              {searchLocation.trim() &&
                !(TW_CITIES as readonly string[]).includes(searchLocation.trim()) && (
                  <option value="__custom__" className="text-slate-900">
                    {searchLocation.trim()}
                  </option>
                )}
            </select>

            <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none">
              {['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'].map((city) => {
                const active = searchLocation.trim() === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSearchLocation(active ? '' : city)}
                    className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-brand-500 text-white font-semibold'
                        : 'bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {city.replace('市', '')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setOnlyFreeLesson(!onlyFreeLesson)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border cursor-pointer ${
                onlyFreeLesson
                  ? 'bg-brand-500/15 border-brand-500/40 text-brand-500 font-semibold'
                  : 'bg-transparent border-white/15 text-white/65 hover:border-white/30'
              }`}
            >
              首堂免費試聽
            </button>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'recommended' | 'price-asc' | 'price-desc' | 'rating'
                )
              }
              aria-label="排序方式"
              className="bg-white/5 border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/80 font-medium focus:outline-none cursor-pointer"
            >
              <option value="recommended" className="text-slate-900">
                預設推薦
              </option>
              <option value="rating" className="text-slate-900">
                最高評分
              </option>
              <option value="price-asc" className="text-slate-900">
                鐘點費：低至高
              </option>
              <option value="price-desc" className="text-slate-900">
                鐘點費：高至低
              </option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchLocation('');
                  setSearchSubject('');
                  setActiveCategory('all');
                  setOnlyFreeLesson(false);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-white/45 hover:text-white px-2 py-1.5 cursor-pointer"
                aria-label="清除篩選"
              >
                <X className="w-3 h-3" />
                清除
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <BookOpen className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" aria-hidden />
          <span className="text-[11px] font-medium text-white/35 flex-shrink-0">科目</span>
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
            <span className="text-[11px] font-medium text-white/35 flex-shrink-0 mr-0.5">分類</span>
            {categoryChips.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-[11px] transition whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-500 border-brand-500/35 font-semibold'
                      : 'bg-transparent text-white/50 border-white/10 hover:border-white/25'
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
