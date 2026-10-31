'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { searchTutors } from '@/lib/tutorService';
import {
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SearchBreadcrumb } from '@/components/SearchBreadcrumb';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { supabase } from '@/lib/supabaseClient';
import {
  collectAvailableCategories,
  collectAvailableSubjectQueries,
  tutorBelongsToCategory,
} from '@/lib/tutorFilters';
import { SUBJECT_QUICK_FILTERS } from '@/data/filterOptions';
import { authIntentForTutor } from '@/lib/contactFlowCopy';
import { HOME_RESET_EVENT } from '@/components/LogoHomeLink';
import { RefreshCw, AlertCircle } from 'lucide-react';

const SUBJECT_QUERY_IDS = SUBJECT_QUICK_FILTERS.filter((s) => s.id !== 'all').map(
  (s) => s.id
);
const HERO_SUBJECT_QUERIES = [
  '英文',
  '國文',
  '數學',
  '日文',
  '理化',
  '程式',
  '鋼琴',
  '唱歌',
  '運動',
  '雅思',
] as const;

const ONLINE_LOCATION = '線上';

function isOnlineLocation(location: string): boolean {
  const q = location.trim().toLowerCase();
  return q === ONLINE_LOCATION || q === 'online' || q === '線上授課';
}

export default function HomePage() {
  const [searchSubject, setSearchSubject] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [onlyFreeLesson, setOnlyFreeLesson] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilterValues>(DEFAULT_ADVANCED_FILTERS);

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [catalogTutors, setCatalogTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);

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
    setIsLoading(true);
    const online = isOnlineLocation(searchLocation);

    try {
      const tutorResult = await searchTutors({
        region: online ? '' : searchLocation,
        subject: searchSubject,
        mode: online ? 'online' : advanced.mode,
        sortBy: advanced.sortBy,
        onlyPublished: true,
      });
      setTutors(tutorResult.tutors);
      setIsFromSupabase(tutorResult.isFromSupabase);
    } catch {
      setIsFromSupabase(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchLocation, searchSubject, advanced.mode, advanced.sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    void searchTutors({ onlyPublished: true, sortBy: 'rating' }).then((result) => {
      if (cancelled) return;
      setCatalogTutors(result.tutors);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableSubjectQueries = useMemo(() => {
    const source = catalogTutors.length > 0 ? catalogTutors : tutors;
    return collectAvailableSubjectQueries(source, [
      ...SUBJECT_QUERY_IDS,
      ...HERO_SUBJECT_QUERIES,
    ]);
  }, [catalogTutors, tutors]);

  const availableCategories = useMemo(() => {
    const source = catalogTutors.length > 0 ? catalogTutors : tutors;
    return collectAvailableCategories(source);
  }, [catalogTutors, tutors]);

  useEffect(() => {
    if (
      activeCategory !== 'all' &&
      availableCategories.size > 0 &&
      !availableCategories.has(activeCategory)
    ) {
      setActiveCategory('all');
    }
  }, [activeCategory, availableCategories]);

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
    return tutors.filter((tutor) => {
      if (
        activeCategory !== 'all' &&
        tutor.categoryId !== activeCategory &&
        !tutorBelongsToCategory(tutor.subjectCategory, activeCategory)
      ) {
        return false;
      }
      if (onlyFreeLesson && !tutor.firstLessonFree) return false;
      return true;
    });
  }, [tutors, activeCategory, onlyFreeLesson]);

  const resetFilters = useCallback(() => {
    setSearchSubject('');
    setSearchLocation('');
    setActiveCategory('all');
    setOnlyFreeLesson(false);
    setAdvanced(DEFAULT_ADVANCED_FILTERS);
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

  const hasActiveFilters =
    Boolean(searchSubject.trim()) ||
    Boolean(searchLocation.trim()) ||
    activeCategory !== 'all' ||
    onlyFreeLesson ||
    advanced.mode !== 'all' ||
    advanced.sortBy !== 'recommended';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HomeHero
        searchSubject={searchSubject}
        setSearchSubject={setSearchSubject}
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        availableSubjectQueries={availableSubjectQueries}
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
            {isLoading ? (
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

        <CategoryFilter
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchSubject={searchSubject}
          setSearchSubject={setSearchSubject}
          onlyFreeLesson={onlyFreeLesson}
          setOnlyFreeLesson={setOnlyFreeLesson}
          mode={advanced.mode}
          setMode={(mode) => setAdvanced((prev) => ({ ...prev, mode }))}
          sortBy={advanced.sortBy}
          setSortBy={(sortBy) => setAdvanced((prev) => ({ ...prev, sortBy }))}
          availableSubjectQueries={availableSubjectQueries}
          availableCategories={availableCategories}
          hasActiveFilters={hasActiveFilters}
          onClearAll={resetFilters}
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

          {/* Superprof：桌面固定三欄（不經兩欄）；僅窄螢幕單欄 */}
          {isLoading ? (
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
