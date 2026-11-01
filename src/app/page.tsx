'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tutor } from '@/types/tutor';
import { Header } from '@/components/Header';
import { HomeHero } from '@/components/HomeHero';
import { CategoryFilter } from '@/components/CategoryFilter';
import { TutorCard } from '@/components/TutorCard';
import { AuthModal } from '@/components/AuthModal';
import { BindEmailModal } from '@/components/BindEmailModal';
import { StudentPassModal } from '@/components/StudentPassModal';
import { ContactViewModal } from '@/components/ContactViewModal';
import { UnlockedTutorsDrawer } from '@/components/UnlockedTutorsDrawer';
import { redactTutorContact, searchTutors } from '@/lib/tutorService';
import { MOCK_TUTORS } from '@/data/mockTutors';
import {
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SearchBreadcrumb } from '@/components/SearchBreadcrumb';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { supabase } from '@/lib/supabaseClient';
import { tutorMatchesMainCategory } from '@/lib/tutorFilters';
import { isMainCategoryKey, type MainCategoryKey } from '@/types/mainCategory';
import { authIntentForTutor } from '@/lib/contactFlowCopy';
import { HOME_RESET_EVENT } from '@/components/LogoHomeLink';
import {
  buildTutorsCategoryPath,
  buildTutorsPathForTag,
  buildTutorsTagPath,
  navigateTutorsPath,
} from '@/lib/tutorTagRoutes';
import { RefreshCw, AlertCircle } from 'lucide-react';

/** 點大類時立刻有名單，不依賴非同步搜尋／舊快取 */
function mocksForCategory(cat: MainCategoryKey | 'all'): Tutor[] {
  const list =
    cat === 'all'
      ? MOCK_TUTORS
      : MOCK_TUTORS.filter((t) => tutorMatchesMainCategory(t, cat));
  return list.map(redactTutorContact);
}

const ONLINE_LOCATION = '線上';

function isOnlineLocation(location: string): boolean {
  const q = location.trim().toLowerCase();
  return q === ONLINE_LOCATION || q === 'online' || q === '線上授課';
}

export default function HomePage() {
  const [searchSubject, setSearchSubject] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [activeCategory, setActiveCategory] = useState<MainCategoryKey | 'all'>('all');
  const [onlyFreeLesson, setOnlyFreeLesson] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilterValues>(DEFAULT_ADVANCED_FILTERS);

  const [tutors, setTutors] = useState<Tutor[]>(() =>
    MOCK_TUTORS.map(redactTutorContact)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  /** 忽略過期的 searchTutors 回應，避免舊篩選結果蓋掉新大類 */
  const searchGenRef = useRef(0);

  const {
    currentUser,
    studentPass,
    contactedTutorIds,
    subscribe,
    cancelPass,
    markContacted,
    hydrate,
    signOut,
  } = useStudentPass();

  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBindEmailOpen, setIsBindEmailOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContactedDrawerOpen, setIsContactedDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let needBind = params.get('bindEmail') === '1';
    try {
      if (sessionStorage.getItem('idaltu_need_bind_email') === '1') needBind = true;
    } catch {
      /* ignore */
    }
    if (needBind) {
      setIsBindEmailOpen(true);
      if (params.has('bindEmail')) {
        params.delete('bindEmail');
        const next = params.toString();
        window.history.replaceState({}, '', next ? `/?${next}` : '/');
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    const gen = ++searchGenRef.current;
    setIsLoading(true);
    const online = isOnlineLocation(searchLocation);
    const mainCategory =
      activeCategory !== 'all' && isMainCategoryKey(activeCategory)
        ? activeCategory
        : '';

    // 樂觀更新：大類一點就先塞示範老師，避免 debounce／競態期間畫面變 0
    const optimistic = mocksForCategory(activeCategory);
    if (optimistic.length > 0) {
      setTutors(optimistic);
    }

    try {
      const tutorResult = await searchTutors({
        region: online ? '' : searchLocation,
        subject: searchSubject,
        q: searchSubject,
        mainCategory,
        mode: online ? 'online' : advanced.mode,
        sortBy: advanced.sortBy,
        onlyPublished: true,
      });
      if (gen !== searchGenRef.current) return;
      // 若遠端莫名回空但我們有示範老師，保住樂觀結果
      if (tutorResult.tutors.length > 0) {
        setTutors(tutorResult.tutors);
      } else if (optimistic.length > 0) {
        setTutors(optimistic);
      } else {
        setTutors([]);
      }
      setIsFromSupabase(tutorResult.isFromSupabase);
    } catch {
      if (gen !== searchGenRef.current) return;
      setIsFromSupabase(false);
      if (optimistic.length > 0) setTutors(optimistic);
    } finally {
      if (gen === searchGenRef.current) setIsLoading(false);
    }
  }, [searchLocation, searchSubject, activeCategory, advanced.mode, advanced.sortBy]);

  useEffect(() => {
    // 換大類立刻樂觀填充（不等 debounce），避免 filteredTutors 把舊名單濾成 0
    const optimistic = mocksForCategory(activeCategory);
    if (optimistic.length > 0) setTutors(optimistic);

    const timer = window.setTimeout(() => {
      void loadData();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadData, activeCategory]);

  /** 聯繫／預約：未登入 → Auth；未訂閱 → Student Pass；已訂閱 → 聯絡方式 */
  const handleInitiateContact = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!studentPass.active) {
      setIsPassModalOpen(true);
      return;
    }
    markContacted(tutor.id);
    setIsContactModalOpen(true);
  };

  const handleAuthSuccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const latest = await hydrate(user.id);
    if (selectedTutor) {
      if (latest.active) {
        markContacted(selectedTutor.id);
        setIsContactModalOpen(true);
      } else {
        setIsPassModalOpen(true);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsContactModalOpen(false);
    setIsPassModalOpen(false);
  };

  const handleSubscribePass = async (
    card?: Parameters<typeof subscribe>[0]
  ) => {
    const next = await subscribe(card);
    if (next.active && selectedTutor) {
      markContacted(selectedTutor.id);
      setIsPassModalOpen(false);
      setIsContactModalOpen(true);
    } else if (next.active) {
      setIsPassModalOpen(false);
    }
  };

  const handleCancelPass = async () => {
    await cancelPass();
    setIsContactModalOpen(false);
  };

  const filteredTutors = useMemo(() => {
    const applyLocal = (list: Tutor[]) =>
      list.filter((tutor) => {
        if (
          activeCategory !== 'all' &&
          !tutorMatchesMainCategory(tutor, activeCategory)
        ) {
          return false;
        }
        if (onlyFreeLesson && !tutor.firstLessonFree) return false;
        return true;
      });

    const next = applyLocal(tutors);
    // 競態／舊回應把名單濾光時，用示範老師兜底（八大類永不空白）
    if (next.length === 0 && activeCategory !== 'all') {
      const fallback = applyLocal(mocksForCategory(activeCategory));
      if (fallback.length > 0) return fallback;
    }
    return next;
  }, [tutors, activeCategory, onlyFreeLesson]);

  const selectMainCategory = useCallback(
    (cat: MainCategoryKey | 'all' | string) => {
      const next: MainCategoryKey | 'all' =
        cat === 'all' || isMainCategoryKey(cat) ? cat : 'all';
      // 大分類綁定獨立網址；全部分類回首頁狀態
      if (isMainCategoryKey(next)) {
        navigateTutorsPath(buildTutorsCategoryPath(next));
        return;
      }
      searchGenRef.current += 1;
      setActiveCategory('all');
      setSearchSubject('');
      setTutors(mocksForCategory('all'));
    },
    []
  );

  /** 點 tag → 進 `/tutors/[main_category]/[slug]`；全部分類也會推導大類 */
  const selectTag = useCallback(
    (tag: string) => {
      const next = tag.trim();
      if (!next) {
        if (isMainCategoryKey(activeCategory)) {
          navigateTutorsPath(buildTutorsCategoryPath(activeCategory));
        } else {
          setSearchSubject('');
        }
        return;
      }
      if (isMainCategoryKey(activeCategory)) {
        navigateTutorsPath(buildTutorsTagPath(activeCategory, next));
        return;
      }
      const href = buildTutorsPathForTag(next);
      if (href) {
        navigateTutorsPath(href);
        return;
      }
      setSearchSubject(next);
    },
    [activeCategory]
  );

  const resetFilters = useCallback(() => {
    searchGenRef.current += 1;
    setSearchSubject('');
    setSearchLocation('');
    setActiveCategory('all');
    setOnlyFreeLesson(false);
    setAdvanced(DEFAULT_ADVANCED_FILTERS);
    setTutors(MOCK_TUTORS.map(redactTutorContact));
  }, []);

  /** Logo／麵包屑「idaltu」回首頁時清空篩選（同頁 soft 點擊也要生效） */
  useEffect(() => {
    const onHomeReset = () => {
      resetFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener(HOME_RESET_EVENT, onHomeReset);
    return () => window.removeEventListener(HOME_RESET_EVENT, onHomeReset);
  }, [resetFilters]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HomeHero
        searchSubject={searchSubject}
        setSearchSubject={setSearchSubject}
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        activeMainCategory={activeCategory}
        setActiveMainCategory={selectMainCategory}
      >
        <Header
          variant="hero"
          user={currentUser}
          hasStudentPass={studentPass.active}
          contactedCount={contactedTutorIds.length}
          onOpenStudentPass={() => setIsPassModalOpen(true)}
          onOpenContacted={() => setIsContactedDrawerOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={() => void handleSignOut()}
        />
      </HomeHero>

      <div className="bg-white flex-1">
        <div className="max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-2 space-y-3">
          <SearchBreadcrumb
            subject={searchSubject}
            regionLabel={
              isOnlineLocation(searchLocation)
                ? '線上'
                : searchLocation.trim() || undefined
            }
            regionForPath={
              isOnlineLocation(searchLocation)
                ? '線上'
                : searchLocation.trim() || 'all'
            }
          />
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[18px] sm:text-[20px] text-[#121212] font-bold">
            {isLoading && filteredTutors.length === 0 ? (
              <span className="text-[#6e6e73] font-medium text-[16px]">正在載入導師…</span>
            ) : (
              <>
                <span className="tabular-nums">{filteredTutors.length.toLocaleString()}</span>
                <span>位私人老師</span>
                {filteredTutors.some((t) => t.reviews.reviewCount > 0) && (
                  <span className="inline-flex text-[#FF6363] tracking-tight text-[14px]" aria-hidden>
                    ★★★★★
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div id="tutor-results" />
        <CategoryFilter
          activeCategory={activeCategory}
          setActiveCategory={selectMainCategory}
          searchSubject={searchSubject}
          setSearchSubject={selectTag}
          onlyFreeLesson={onlyFreeLesson}
          setOnlyFreeLesson={setOnlyFreeLesson}
          mode={advanced.mode}
          setMode={(mode) => setAdvanced((prev) => ({ ...prev, mode }))}
          sortBy={advanced.sortBy}
          setSortBy={(sortBy) => setAdvanced((prev) => ({ ...prev, sortBy }))}
          urlBound
        />

        <main id="tutors" className="max-w-[1060px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10 sm:pb-14">
          <div className="mb-5">
            <h2 className="text-[22px] sm:text-[28px] font-bold text-[#121212] tracking-tight leading-tight">
              {searchSubject
                ? `${searchSubject} 家教課程`
                : isOnlineLocation(searchLocation)
                  ? '線上家教課程'
                  : searchLocation
                    ? `${searchLocation}熱門家教課程`
                    : '探索全台家教課程'}
            </h2>
          </div>

          {!isFromSupabase && !isLoading && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>目前為備用假資料。請確認 `.env.local` 已填入 Supabase 金鑰。</span>
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 rounded-full text-amber-900 font-semibold text-[11px] flex-shrink-0 transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                重新整理
              </button>
            </div>
          )}

          {/* Superprof：桌面固定三欄；有樂觀名單時不蓋 skeleton，避免大類切換空白 */}
          {isLoading && filteredTutors.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((skeletonId) => (
                <div key={skeletonId} className="animate-pulse">
                  <div className="aspect-square rounded-[32px] bg-[#f0f0f0]" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-[#f0f0f0]" />
                  <div className="mt-2 h-3 w-full rounded bg-[#f5f5f5]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-[#f5f5f5]" />
                </div>
              ))}
            </div>
          ) : filteredTutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
              {filteredTutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  isUnlocked={studentPass.active}
                  onContact={handleInitiateContact}
                />
              ))}
            </div>
          ) : (
            <EmptySearchState
              regionLabel={
                isOnlineLocation(searchLocation)
                  ? '線上'
                  : searchLocation.trim() || undefined
              }
              subjectLabel={searchSubject.trim() || undefined}
              onReset={resetFilters}
              onWiden={() => {
                setAdvanced(DEFAULT_ADVANCED_FILTERS);
                setActiveCategory('all');
                setOnlyFreeLesson(false);
              }}
              className="my-8"
            />
          )}
        </main>
      </div>

      <SiteFooter variant="light" />

      <UnlockedTutorsDrawer
        isOpen={isContactedDrawerOpen}
        onClose={() => setIsContactedDrawerOpen(false)}
        tutors={tutors}
        unlockedIds={contactedTutorIds}
      />

      <StudentPassModal
        isOpen={isPassModalOpen}
        pass={studentPass}
        onClose={() => setIsPassModalOpen(false)}
        onSubscribe={handleSubscribePass}
        onCancelPass={() => void handleCancelPass()}
        tutorName={selectedTutor?.name}
      />

      {isContactModalOpen && studentPass.active && (
        <ContactViewModal
          tutor={selectedTutor}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedTutor(null);
          }}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        intentHint={
          selectedTutor ? authIntentForTutor(selectedTutor.name) : null
        }
      />

      <BindEmailModal
        isOpen={isBindEmailOpen}
        onClose={() => setIsBindEmailOpen(false)}
        onBound={() => {
          void hydrate();
        }}
      />
    </div>
  );
}
