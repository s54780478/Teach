'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tutor } from '@/types/tutor';
import { Header } from '@/components/Header';
import { HomeHero } from '@/components/HomeHero';
import { CategoryFilter } from '@/components/CategoryFilter';
import { TutorCard } from '@/components/TutorCard';
import { AuthModal } from '@/components/AuthModal';
import { StudentPassModal } from '@/components/StudentPassModal';
import { ContactViewModal } from '@/components/ContactViewModal';
import { UnlockedTutorsDrawer } from '@/components/UnlockedTutorsDrawer';
import { searchTutors } from '@/lib/tutorService';
import {
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { supabase } from '@/lib/supabaseClient';
import {
  collectAvailableCategories,
  collectAvailableSubjectQueries,
} from '@/lib/tutorFilters';
import { SUBJECT_QUICK_FILTERS } from '@/data/filterOptions';
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
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContactedDrawerOpen, setIsContactedDrawerOpen] = useState(false);

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
      if (activeCategory !== 'all' && tutor.subjectCategory !== activeCategory) return false;
      if (onlyFreeLesson && !tutor.firstLessonFree) return false;
      return true;
    });
  }, [tutors, activeCategory, onlyFreeLesson]);

  const resetFilters = () => {
    setSearchSubject('');
    setSearchLocation('');
    setActiveCategory('all');
    setOnlyFreeLesson(false);
    setAdvanced(DEFAULT_ADVANCED_FILTERS);
  };

  const hasActiveFilters =
    Boolean(searchSubject.trim()) ||
    Boolean(searchLocation.trim()) ||
    activeCategory !== 'all' ||
    onlyFreeLesson ||
    advanced.mode !== 'all' ||
    advanced.sortBy !== 'recommended';

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
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

      <div className="bg-[#0c0c0e] flex-1 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-3">
          <p className="flex items-center gap-2 text-sm sm:text-base text-white font-medium">
            <span className="font-bold">
              {Math.max(filteredTutors.length, 1).toLocaleString()}位
            </span>
            有評價的導師
            <span className="inline-flex text-brand-500 tracking-tight text-sm" aria-hidden>
              ★★★★★
            </span>
          </p>
          <p className="mt-1 text-xs text-white/40">
            許多導師提供首堂免費體驗 · Student Pass 解鎖聯繫
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

        <main id="tutors" className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {searchSubject
                ? `${searchSubject} 家教課程`
                : isOnlineLocation(searchLocation)
                  ? '線上家教課程'
                  : searchLocation
                    ? `${searchLocation}熱門家教課程`
                    : '探索全台家教課程'}
            </h2>
            <p className="text-xs text-white/45 mt-1">
              {isLoading
                ? '正在載入課程…'
                : `共 ${filteredTutors.length} 門課程 · 許多導師提供首堂免費體驗`}
              {!isFromSupabase && !isLoading ? ' · 示範資料' : ''}
            </p>
          </div>

          {!isFromSupabase && !isLoading && (
            <div className="mb-5 p-3 bg-amber-500/10 border border-amber-400/25 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>目前為備用假資料。請確認 `.env.local` 已填入 Supabase 金鑰。</span>
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-amber-50 font-semibold text-[11px] flex-shrink-0 transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                重新整理
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
              {[1, 2, 3, 4, 5, 6].map((skeletonId) => (
                <div key={skeletonId} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-3xl bg-white/10" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-full rounded bg-white/5" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : filteredTutors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
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

      <SiteFooter variant="dark" />

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
          selectedTutor
            ? `登入後開通 Student Pass，即可聯繫「${selectedTutor.name}」（解鎖全平台、可隨時取消）。`
            : null
        }
      />
    </div>
  );
}
