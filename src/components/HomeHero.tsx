'use client';

import React, { useState } from 'react';
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

/** 永遠顯示（對齊 Superprof 首頁科目列，不因資料過濾而消失） */
const HERO_CATEGORIES = [
  { label: '英文', icon: Languages, query: '英文' },
  { label: '數學', icon: Calculator, query: '數學' },
  { label: '鋼琴', icon: Music2, query: '鋼琴' },
  { label: '唱歌', icon: Mic2, query: '唱歌' },
  { label: '日語', icon: Languages, query: '日文' },
  { label: '程式', icon: Code2, query: '程式' },
  { label: '理化', icon: Pencil, query: '理化' },
  { label: '中文', icon: BookOpen, query: '國文' },
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

/**
 * Superprof 首頁節奏（非硬抄英文字級）：
 * 置中標題 → 白膠囊搜尋 → 科目圖示列 → 下方白底列表
 */
export const HomeHero: React.FC<HomeHeroProps> = ({
  searchSubject,
  setSearchSubject,
  searchLocation,
  setSearchLocation,
  onSearch,
  children,
}) => {
  const router = useRouter();
  const [locationFocused, setLocationFocused] = useState(false);

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
    <>
      {/* Header 必須在 overflow-hidden 外，sticky 才不會被捲走 */}
      {children}

      <section className="relative overflow-hidden text-[#121212]">
        {/* Superprof：淡粉 → 白，底部微弧 */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 90% 80% at 50% -10%, #ffd6d3 0%, #ffe9e7 42%, #fff5f4 70%, #ffffff 100%)',
          }}
        />

        <div className="relative max-w-[640px] mx-auto px-5 pt-5 sm:pt-8 pb-8 sm:pb-10 text-center">
          <h1 className="text-[32px] sm:text-[44px] font-black tracking-[-0.03em] leading-[1.15] text-[#121212]">
            找到最適合你的
            <br />
            私人老師
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 sm:mt-7 mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center rounded-[24px] sm:rounded-[40px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden min-h-[56px] sm:min-h-[64px]">
              <label className="flex items-center gap-2.5 flex-1 min-w-0 px-4 sm:pl-5 sm:pr-3 py-3.5 sm:py-0 text-left">
                <BookOpen className="w-[18px] h-[18px] text-[#FF6363] flex-shrink-0" aria-hidden />
                <input
                  type="text"
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                  placeholder="試試「數學」"
                  aria-label="想學什麼？"
                  className="w-full bg-transparent text-[15px] font-semibold text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
                />
              </label>

              <div className="hidden sm:block w-px h-7 bg-[#ececec] flex-shrink-0" aria-hidden />
              <div className="sm:hidden h-px w-full bg-[#f0f0f0]" aria-hidden />

              <div className="relative flex items-center gap-2.5 flex-1 min-w-0 px-4 sm:px-3 py-3.5 sm:py-0 text-left">
                {isOnline ? (
                  <Monitor className="w-[18px] h-[18px] text-[#FF6363] flex-shrink-0" aria-hidden />
                ) : (
                  <MapPin className="w-[18px] h-[18px] text-[#FF6363] flex-shrink-0" aria-hidden />
                )}
                <input
                  type="text"
                  list="hero-location-options"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => window.setTimeout(() => setLocationFocused(false), 150)}
                  placeholder="上課地點"
                  aria-label="在哪裡？"
                  className="w-full bg-transparent text-[15px] font-semibold text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none"
                />
                <datalist id="hero-location-options">
                  <option value={ONLINE_LOCATION} />
                  {TW_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>

                {locationFocused && (
                  <div className="absolute left-2 right-2 top-full mt-2 z-20 rounded-2xl border border-black/5 bg-white shadow-xl overflow-hidden text-left">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setSearchLocation(ONLINE_LOCATION)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${
                        isOnline ? 'bg-[#fff0f0] text-[#FF6363]' : 'text-[#333] hover:bg-[#f7f7f7]'
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
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${
                          searchLocation === city
                            ? 'bg-[#fff0f0] text-[#FF6363]'
                            : 'text-[#333] hover:bg-[#f7f7f7]'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 sm:p-1.5 sm:pr-1.5">
                <button
                  type="submit"
                  className="w-full sm:w-auto h-11 sm:h-[52px] px-6 inline-flex items-center justify-center gap-2 bg-[#FF6363] hover:bg-[#ff5252] text-white text-[14px] font-semibold rounded-full transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  搜尋
                </button>
              </div>
            </div>
          </form>

          {/* Superprof 科目圖示列：永遠顯示 */}
          <div className="mt-5 sm:mt-6 relative">
            <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none rounded-full bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-black/[0.04] px-1.5 py-1.5 pr-9">
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
                    className={`flex flex-col items-center justify-center gap-1 min-w-[68px] h-[54px] px-2 rounded-2xl transition cursor-pointer ${
                      active
                        ? 'text-[#FF6363] bg-[#fff0f0]'
                        : 'text-[#424245] hover:text-[#1d1d1f] hover:bg-black/[0.03]'
                    }`}
                  >
                    <Icon className="w-[20px] h-[20px]" strokeWidth={1.5} />
                    <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-black/5 shadow-sm flex items-center justify-center">
              <ChevronRight className="w-3.5 h-3.5 text-[#666]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
