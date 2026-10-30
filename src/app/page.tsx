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
  AdvancedFilterPanel,
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function HomePage() {
  // Search and Filter States
  const [searchSubject, setSearchSubject] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [onlyFreeLesson, setOnlyFreeLesson] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilterValues>(DEFAULT_ADVANCED_FILTERS);

  // Supabase Data & Loading States
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFromSupabase, setIsFromSupabase] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Modals / Drawer
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContactedDrawerOpen, setIsContactedDrawerOpen] = useState(false);

  // 2. 載入導師資料（時薪／授課方式／排序即時打 Supabase）
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const tutorResult = await searchTutors({
        region: searchLocation,
        subject: searchSubject,
        minRate: advanced.minRate === '' ? undefined : advanced.minRate,
        maxRate: advanced.maxRate === '' ? undefined : advanced.maxRate,
        mode: advanced.mode,
        sortBy: advanced.sortBy,
        onlyPublished: true,
      });
      setTutors(tutorResult.tutors);
      setIsFromSupabase(tutorResult.isFromSupabase);

      if (tutorResult.error && !tutorResult.isFromSupabase) {
        setErrorMessage(tutorResult.error);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '讀取資料失敗');
    } finally {
      setIsLoading(false);
    }
  }, [searchLocation, searchSubject, advanced]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  // 點擊聯絡：未登入 → Auth；未訂閱 → Student Pass Modal；已訂閱 → 顯示聯絡方式
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
    const { data: { session } } = await supabase.auth.getSession();
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

  // 7. 分類／首堂免費仍於前端補強（地區科目時薪模式已由 searchTutors 處理）
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

  const handleAdvancedChange = (next: AdvancedFilterValues) => {
    setAdvanced(next);
  };

  const handleSortByFromCategory = (
    sort: 'recommended' | 'price-asc' | 'price-desc' | 'rating'
  ) => {
    setAdvanced((prev) => ({ ...prev, sortBy: sort }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      {/* Superprof 暗色 Hero：導覽 + 大搜尋（探索後導向 /lessons SEO 路由） */}
      <HomeHero
        searchSubject={searchSubject}
        setSearchSubject={setSearchSubject}
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
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

      {/* Superprof 暗色列表區：三欄直式課程卡 */}
      <div className="bg-[#0c0c0e] flex-1 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-3">
          <p className="flex items-center gap-2 text-sm sm:text-base text-white font-medium">
            <span className="font-bold">{Math.max(filteredTutors.length, 1).toLocaleString()}位</span>
            有評價的導師
            <span className="inline-flex text-brand-500 tracking-tight text-sm" aria-hidden>
              ★★★★★
            </span>
          </p>
        </div>

        <CategoryFilter
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          searchSubject={searchSubject}
          setSearchSubject={setSearchSubject}
          onlyFreeLesson={onlyFreeLesson}
          setOnlyFreeLesson={setOnlyFreeLesson}
          setSortBy={handleSortByFromCategory}
          sortBy={advanced.sortBy}
        />

        <main id="tutors" className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {searchSubject
                  ? `${searchSubject} 家教課程`
                  : searchLocation
                    ? `${searchLocation}熱門家教課程`
                    : '探索全台家教課程'}
              </h2>
              <p className="text-xs text-white/45 mt-1">
                {isLoading
                  ? '正在載入課程…'
                  : `共 ${filteredTutors.length} 門課程 · 首堂免費試聽 · Student Pass 聯繫`}
                {!isFromSupabase && !isLoading ? ' · 示範資料' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <AdvancedFilterPanel
                value={advanced}
                onChange={handleAdvancedChange}
                variant="dark"
                layout="trigger-only"
              />
              {(searchSubject ||
                searchLocation ||
                advanced.mode !== 'all' ||
                advanced.minRate !== '' ||
                advanced.maxRate !== '' ||
                activeCategory !== 'all' ||
                onlyFreeLesson) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-white/50 hover:text-white underline cursor-pointer"
                >
                  清除篩選
                </button>
              )}
            </div>
          </div>

          {!isFromSupabase && !isLoading && (
            <div className="mb-5 p-3 bg-amber-500/10 border border-amber-400/25 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>目前為備用假資料。若已在 Supabase 執行 schema，可重新整理連線。</span>
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

          <div className="flex flex-col lg:flex-row gap-8">
            <AdvancedFilterPanel
              value={advanced}
              onChange={handleAdvancedChange}
              variant="dark"
              layout="sidebar-only"
            />

            <div className="flex-1 min-w-0">
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
                  regionLabel={searchLocation.trim() || undefined}
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
            </div>
          </div>
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
      />
    </div>
  );
}
