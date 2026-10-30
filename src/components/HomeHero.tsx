'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  MapPin,
  Languages,
  Calculator,
  Music2,
  Code2,
  Mic2,
  Pencil,
  Dumbbell,
  ChevronRight,
  Search,
  Monitor,
} from 'lucide-react';
import { TW_CITIES } from '@/data/filterOptions';
import { buildLessonsPath } from '@/lib/seoRoutes';

const HERO_CATEGORIES = [
  { label: '英文', icon: Languages, query: '英文' },
  { label: '中文', icon: BookOpen, query: '國文' },
  { label: '數學', icon: Calculator, query: '數學' },
  { label: '日語', icon: Languages, query: '日文' },
  { label: '理化', icon: Pencil, query: '理化' },
  { label: '程式', icon: Code2, query: '程式' },
  { label: '鋼琴', icon: Music2, query: '鋼琴' },
  { label: '唱歌', icon: Mic2, query: '唱歌' },
  { label: '運動', icon: Dumbbell, query: '運動' },
  { label: '雅思', icon: Languages, query: '雅思' },
] as const;

const ONLINE_LOCATION = '線上';

interface HomeHeroProps {
  searchSubject: string;
  setSearchSubject: (val: string) => void;
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  onSearch?: () => void;
  availableSubjectQueries?: Set<string> | null;
  children?: React.ReactNode;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  searchSubject,
  setSearchSubject,
  searchLocation,
  setSearchLocation,
  onSearch,
  availableSubjectQueries = null,
  children,
}) => {
  const router = useRouter();
  const [locationFocused, setLocationFocused] = useState(false);

  const visibleCategories = useMemo(() => {
    if (!availableSubjectQueries) return [...HERO_CATEGORIES];
    return HERO_CATEGORIES.filter((cat) => availableSubjectQueries.has(cat.query));
  }, [availableSubjectQueries]);

  const goToLessons = (subject: string, location: string) => {
    const path = buildLessonsPath(location || 'all', subject || 'all');
    router.push(path);
    onSearch?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToLessons(searchSubject, searchLocation);
  };

  const isOnline = searchLocation.trim() === ONLINE_LOCATION;

  return (
    <section className="relative overflow-hidden bg-[#0c0c0e] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255,90,95,0.22) 0%, rgba(255,90,95,0.06) 35%, transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.04),_transparent_55%)]" />

      <div className="relative">
        {children}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-10 sm:pb-14 text-center">
          <h1 className="text-[1.85rem] sm:text-4xl md:text-[2.75rem] font-bold tracking-tight leading-[1.2] text-white animate-fade-rise">
            找到最適合你的
            <br className="sm:hidden" />
            <span className="sm:ml-2">私人老師</span>
          </h1>
          <p
            className="mt-3 text-sm sm:text-base text-white/50 animate-fade-rise max-w-xl mx-auto leading-relaxed"
            style={{ animationDelay: '60ms' }}
          >
            全台驗證師資 · 許多導師提供首堂免費體驗 · Student Pass 聯繫
          </p>

          {/* Superprof 雙欄搜尋：想學什麼？ + 在哪裡？ */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 sm:mt-10 mx-auto max-w-2xl animate-fade-rise"
            style={{ animationDelay: '120ms' }}
          >
            <div className="search-pill-focus flex flex-col sm:flex-row sm:items-stretch gap-0 rounded-2xl sm:rounded-full border-2 border-brand-500/80 bg-[#121216]/95 backdrop-blur-xl overflow-hidden shadow-[0_0_0_1px_rgba(255,90,95,0.12),0_12px_48px_rgba(255,90,95,0.16)] transition duration-300 hover:border-brand-500">
              <label className="flex flex-col items-stretch gap-0.5 flex-1 min-w-0 px-4 sm:px-5 py-3 sm:py-2.5 text-left hover:bg-white/[0.03] transition">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  想學什麼？
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden />
                  <input
                    type="text"
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    placeholder="數學、鋼琴、英文…"
                    aria-label="想學什麼？"
                    className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-white placeholder:text-white/35 focus:outline-none"
                  />
                </span>
              </label>

              <div className="hidden sm:block w-px self-stretch my-2 bg-white/15" aria-hidden />
              <div className="sm:hidden h-px w-full bg-white/10" aria-hidden />

              <div className="relative flex flex-col flex-1 min-w-0 px-4 sm:px-5 py-3 sm:py-2.5 text-left hover:bg-white/[0.03] transition">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  在哪裡？
                </span>
                <label className="flex items-center gap-2">
                  {isOnline ? (
                    <Monitor className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden />
                  ) : (
                    <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden />
                  )}
                  <input
                    type="text"
                    list="hero-location-options"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onFocus={() => setLocationFocused(true)}
                    onBlur={() => window.setTimeout(() => setLocationFocused(false), 150)}
                    placeholder="輸入地區，或選擇線上"
                    aria-label="在哪裡？"
                    className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-white placeholder:text-white/35 focus:outline-none"
                  />
                </label>
                <datalist id="hero-location-options">
                  <option value={ONLINE_LOCATION} />
                  {TW_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>

                {locationFocused && (
                  <div className="absolute left-3 right-3 top-full mt-1 z-20 rounded-xl border border-white/15 bg-[#1a1a1e] shadow-xl overflow-hidden text-left">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setSearchLocation(ONLINE_LOCATION)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer transition ${
                        isOnline
                          ? 'bg-brand-500/15 text-brand-500'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      線上授課
                    </button>
                    {['台北市', '新北市', '台中市', '高雄市'].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSearchLocation(city)}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer transition ${
                          searchLocation === city
                            ? 'bg-brand-500/15 text-brand-500'
                            : 'text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 sm:p-1.5 sm:pl-0">
                <button
                  type="submit"
                  className="w-full sm:w-auto h-full min-h-[44px] flex-shrink-0 inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.97] text-white text-sm font-bold px-7 rounded-xl sm:rounded-full transition duration-200 cursor-pointer shadow-md shadow-brand-500/30"
                >
                  <Search className="w-4 h-4" />
                  <span className="sm:inline">搜尋</span>
                </button>
              </div>
            </div>
          </form>

          {visibleCategories.length > 0 && (
            <div
              className="mt-7 sm:mt-8 relative max-w-3xl mx-auto animate-fade-rise"
              style={{ animationDelay: '180ms' }}
            >
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none rounded-full bg-white/[0.06] border border-white/10 px-2 py-2.5 pl-3 pr-10">
                {visibleCategories.map((cat) => {
                  const Icon = cat.icon;
                  const active = searchSubject === cat.query;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        setSearchSubject(cat.query);
                        goToLessons(cat.query, searchLocation || 'all');
                      }}
                      className={`flex flex-col items-center gap-1 min-w-[4.25rem] px-1.5 py-1.5 rounded-2xl transition duration-200 cursor-pointer ${
                        active
                          ? 'text-brand-500 bg-brand-500/10'
                          : 'text-white/65 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[10px] font-medium whitespace-nowrap">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              {visibleCategories.length > 5 && (
                <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-white/70" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
