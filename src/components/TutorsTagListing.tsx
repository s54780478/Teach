'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Tutor } from '@/types/tutor';
import type { MainCategoryKey } from '@/types/mainCategory';
import { isMainCategoryKey } from '@/types/mainCategory';
import { Header } from '@/components/Header';
import { TutorCard } from '@/components/TutorCard';
import { AuthModal } from '@/components/AuthModal';
import { StudentPassModal } from '@/components/StudentPassModal';
import { ContactViewModal } from '@/components/ContactViewModal';
import { UnlockedTutorsDrawer } from '@/components/UnlockedTutorsDrawer';
import { CategoryFilter } from '@/components/CategoryFilter';
import {
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SiteFooter } from '@/components/SiteFooter';
import { LogoHomeLink } from '@/components/LogoHomeLink';
import { useStudentPass } from '@/hooks/useStudentPass';
import { authIntentForTutor } from '@/lib/contactFlowCopy';
import { supabase } from '@/lib/supabaseClient';
import {
  buildTutorsCategoryPath,
  buildTutorsTagPath,
  mainCategoryDisplayName,
  navigateTutorsPath,
} from '@/lib/tutorTagRoutes';

interface TutorsTagListingProps {
  mainCategory: string;
  /** 已 decode 的標籤；空字串＝僅大類頁 */
  tag: string;
  categoryValid: boolean;
}

type SearchApiResponse = {
  tutors?: Tutor[];
  isFromSupabase?: boolean;
  error?: string | null;
};

export const TutorsTagListing: React.FC<TutorsTagListingProps> = ({
  mainCategory,
  tag,
  categoryValid,
}) => {
  const categoryName = mainCategoryDisplayName(mainCategory);
  const activeCategory: MainCategoryKey | 'all' = categoryValid
    ? (mainCategory as MainCategoryKey)
    : 'all';

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromSupabase, setIsFromSupabase] = useState(false);
  const [onlyFreeLesson, setOnlyFreeLesson] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilterValues>(
    DEFAULT_ADVANCED_FILTERS
  );

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

  const loadTutors = useCallback(async () => {
    if (!categoryValid) {
      setTutors([]);
      setIsFromSupabase(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const qs = new URLSearchParams();
    qs.set('main_category', mainCategory);
    if (tag) {
      qs.set('q', tag);
      qs.set('subject', tag);
    }
    qs.set('sortBy', advanced.sortBy);
    qs.set('mode', advanced.mode);

    try {
      const res = await fetch(`/api/tutors/search?${qs.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as SearchApiResponse;
      let list = Array.isArray(data.tutors) ? data.tutors : [];
      if (onlyFreeLesson) {
        list = list.filter((t) => t.firstLessonFree);
      }
      setTutors(list);
      setIsFromSupabase(Boolean(data.isFromSupabase));
    } catch {
      setTutors([]);
      setIsFromSupabase(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    categoryValid,
    mainCategory,
    tag,
    advanced.sortBy,
    advanced.mode,
    onlyFreeLesson,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTutors();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [loadTutors]);

  const handleSelectCategory = (cat: string) => {
    if (cat === 'all') {
      navigateTutorsPath('/');
      return;
    }
    if (isMainCategoryKey(cat)) {
      navigateTutorsPath(buildTutorsCategoryPath(cat));
    }
  };

  const handleSelectTag = (nextTag: string) => {
    if (!isMainCategoryKey(mainCategory)) {
      navigateTutorsPath('/');
      return;
    }
    if (!nextTag.trim()) {
      navigateTutorsPath(buildTutorsCategoryPath(mainCategory));
      return;
    }
    navigateTutorsPath(buildTutorsTagPath(mainCategory, nextTag));
  };

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

  const heading = tag
    ? `${tag} 家教課程`
    : `${categoryName}家教課程`;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <div
        className="border-b border-black/[0.06]"
        style={{
          background:
            'linear-gradient(115deg, #ffe4e1 0%, #fff8f7 55%, #ffffff 100%)',
        }}
      >
        <Header
          variant="hero"
          user={currentUser}
          hasStudentPass={studentPass.active}
          contactedCount={contactedTutorIds.length}
          onOpenStudentPass={() => setIsPassModalOpen(true)}
          onOpenContacted={() => setIsContactedDrawerOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSignOut={() => void signOut()}
        />
      </div>

      <div className="max-w-[1060px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <nav
          className="flex flex-wrap items-center gap-1 text-[13px] text-[#6e6e73] mb-4"
          aria-label="麵包屑"
        >
          <LogoHomeLink className="font-semibold text-[#1d1d1f] hover:text-brand-500 transition">
            idaltu
          </LogoHomeLink>
          <span className="text-[#86868b] px-0.5 select-none" aria-hidden>
            &gt;
          </span>
          {categoryValid ? (
            <button
              type="button"
              onClick={() =>
                navigateTutorsPath(
                  buildTutorsCategoryPath(mainCategory as MainCategoryKey)
                )
              }
              className="hover:text-[#1d1d1f] transition cursor-pointer"
            >
              {categoryName}
            </button>
          ) : (
            <span>{categoryName}</span>
          )}
          {tag ? (
            <>
              <span className="text-[#86868b] px-0.5 select-none" aria-hidden>
                &gt;
              </span>
              <span className="text-[#1d1d1f] font-medium">{tag}</span>
            </>
          ) : null}
        </nav>

        <h1 className="text-[28px] sm:text-[36px] font-black tracking-tight leading-tight text-[#1d1d1f]">
          {heading}
        </h1>
        <p className="mt-2 text-sm text-[#6e6e73]">
          {isLoading
            ? '正在為你媒合最適合的老師…'
            : `顯示 ${tutors.length} 位導師 · 許多人提供第一堂課免費體驗`}
          {!isFromSupabase && !isLoading ? ' · 示範資料' : ''}
        </p>
      </div>

      <CategoryFilter
        activeCategory={activeCategory}
        setActiveCategory={handleSelectCategory}
        searchSubject={tag}
        setSearchSubject={handleSelectTag}
        onlyFreeLesson={onlyFreeLesson}
        setOnlyFreeLesson={setOnlyFreeLesson}
        mode={advanced.mode}
        setMode={(mode) => setAdvanced((prev) => ({ ...prev, mode }))}
        sortBy={advanced.sortBy}
        setSortBy={(sortBy) => setAdvanced((prev) => ({ ...prev, sortBy }))}
        urlBound
      />

      <main className="flex-1 max-w-[1060px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10 sm:pb-14">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
          </div>
        ) : tutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
            {tutors.map((tutor) => (
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
            subjectLabel={tag || categoryName}
            onReset={() => {
              setOnlyFreeLesson(false);
              setAdvanced(DEFAULT_ADVANCED_FILTERS);
              if (isMainCategoryKey(mainCategory)) {
                navigateTutorsPath(buildTutorsCategoryPath(mainCategory));
              } else {
                navigateTutorsPath('/');
              }
            }}
            onWiden={() => {
              setOnlyFreeLesson(false);
              setAdvanced(DEFAULT_ADVANCED_FILTERS);
              navigateTutorsPath('/');
            }}
          />
        )}
      </main>

      <StudentPassModal
        isOpen={isPassModalOpen}
        pass={studentPass}
        onClose={() => setIsPassModalOpen(false)}
        onSubscribe={async (card) => {
          const next = await subscribe(card);
          if (next.active && selectedTutor) {
            markContacted(selectedTutor.id);
            setIsPassModalOpen(false);
            setIsContactModalOpen(true);
          } else if (next.active) {
            setIsPassModalOpen(false);
          }
        }}
        onCancelPass={() => void cancelPass()}
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
        intentHint={
          selectedTutor ? authIntentForTutor(selectedTutor.name) : null
        }
        onSuccess={async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const user = session?.user;
          if (!user) return;
          const pass = await hydrate(user.id);
          if (selectedTutor) {
            if (pass.active) {
              markContacted(selectedTutor.id);
              setIsContactModalOpen(true);
            } else {
              setIsPassModalOpen(true);
            }
          }
        }}
      />

      <UnlockedTutorsDrawer
        isOpen={isContactedDrawerOpen}
        onClose={() => setIsContactedDrawerOpen(false)}
        tutors={tutors}
        unlockedIds={contactedTutorIds}
      />

      <SiteFooter variant="light" />
    </div>
  );
};
