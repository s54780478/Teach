'use client';

import React from 'react';
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

interface HomeHeroProps {
  searchSubject: string;
  setSearchSubject: (val: string) => void;
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  onSearch?: () => void;
  children?: React.ReactNode;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  searchSubject,
  setSearchSubject,
  searchLocation,
  setSearchLocation,
  onSearch,
  children,
}) => {
  const router = useRouter();

  const goToLessons = (subject: string, location: string) => {
    const path = buildLessonsPath(location || 'all', subject || 'all');
    router.push(path);
    onSearch?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToLessons(searchSubject, searchLocation);
  };

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
            className="mt-3 text-sm sm:text-base text-white/50 animate-fade-rise"
            style={{ animationDelay: '60ms' }}
          >
            全台驗證師資 · 首堂免費試聽 · Student Pass 聯繫
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 sm:mt-10 mx-auto max-w-2xl animate-fade-rise"
            style={{ animationDelay: '120ms' }}
          >
            <div className="search-pill-focus flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 rounded-[1.85rem] sm:rounded-full border-2 border-brand-500/80 bg-[#121216]/95 backdrop-blur-xl p-2 sm:p-1.5 shadow-[0_0_0_1px_rgba(255,90,95,0.12),0_12px_48px_rgba(255,90,95,0.16)] transition duration-300 hover:border-brand-500 hover:shadow-[0_0_0_1px_rgba(255,90,95,0.2),0_16px_56px_rgba(255,90,95,0.22)]">
              <label className="flex items-center gap-2.5 flex-1 min-w-0 px-3.5 sm:px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-full hover:bg-white/[0.03] transition">
                <BookOpen className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden />
                <input
                  type="text"
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                  placeholder='試看看「數學」、「烏克麗麗」'
                  aria-label="你想學什麼"
                  className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-white placeholder:text-white/35 focus:outline-none"
                />
              </label>

              <div className="hidden sm:block w-px h-9 bg-white/15" aria-hidden />

              <label className="flex items-center gap-2.5 flex-1 min-w-0 px-3.5 sm:px-5 py-3 sm:py-2.5 border-t border-white/10 sm:border-0 rounded-2xl sm:rounded-full hover:bg-white/[0.03] transition">
                <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden />
                <input
                  type="text"
                  list="hero-tw-cities"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="授課地區：台北、中壢…"
                  aria-label="授課地區"
                  className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-white placeholder:text-white/35 focus:outline-none"
                />
                <datalist id="hero-tw-cities">
                  {TW_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </label>

              <button
                type="submit"
                className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.97] text-white text-sm font-bold px-7 py-3.5 sm:py-3 rounded-full transition duration-200 cursor-pointer shadow-md shadow-brand-500/30"
              >
                <Search className="w-4 h-4 sm:hidden" />
                探索一下
              </button>
            </div>
          </form>

          <div
            className="mt-7 sm:mt-8 relative max-w-3xl mx-auto animate-fade-rise"
            style={{ animationDelay: '180ms' }}
          >
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none rounded-full bg-white/[0.06] border border-white/10 px-2 py-2.5 pl-3 pr-10">
              {HERO_CATEGORIES.map((cat) => {
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
                    <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
                    <span className="text-[10px] font-medium whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white/70" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
