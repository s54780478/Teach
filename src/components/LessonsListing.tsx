'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Monitor, MapPin } from 'lucide-react';
import type { Tutor } from '@/types/tutor';
import { searchTutors } from '@/lib/tutorService';
import {
  buildLessonsTitle,
  fromRegionSlug,
  fromSubjectSlug,
  regionDisplayName,
} from '@/lib/seoRoutes';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { TutorCard } from '@/components/TutorCard';
import { AuthModal } from '@/components/AuthModal';
import { StudentPassModal } from '@/components/StudentPassModal';
import { ContactViewModal } from '@/components/ContactViewModal';
import { UnlockedTutorsDrawer } from '@/components/UnlockedTutorsDrawer';
import {
  DEFAULT_ADVANCED_FILTERS,
  SORT_OPTIONS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SearchBreadcrumb } from '@/components/SearchBreadcrumb';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { authIntentForTutor } from '@/lib/contactFlowCopy';

interface LessonsListingProps {
  regionSlug: string;
  subjectSlug: string;
}

export const LessonsListing: React.FC<LessonsListingProps> = ({
  regionSlug,
  subjectSlug,
}) => {
  const regionQuery = fromRegionSlug(regionSlug);
  const subjectQuery = fromSubjectSlug(subjectSlug);
  const regionLabel = regionDisplayName(regionSlug);
  const subjectLabel = subjectQuery || '熱門';
  const pageTitle = buildLessonsTitle(regionLabel, subjectLabel);

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromSupabase, setIsFromSupabase] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilterValues>(DEFAULT_ADVANCED_FILTERS);

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

  useEffect(() => {
    document.title = `${pageTitle} ｜ idaltu`;
  }, [pageTitle]);

  const onlineRegion =
    regionQuery.trim() === '線上' ||
    regionQuery.trim().toLowerCase() === 'online';

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const timer = window.setTimeout(() => {
      void searchTutors({
        region: onlineRegion ? '' : regionQuery,
        subject: subjectQuery,
        mode: onlineRegion ? 'online' : advanced.mode,
        sortBy: advanced.sortBy,
        onlyPublished: true,
      }).then((result) => {
        if (cancelled) return;
        setTutors(result.tutors);
        setIsFromSupabase(result.isFromSupabase);
        setIsLoading(false);
      });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    regionSlug,
    subjectSlug,
    regionQuery,
    subjectQuery,
    onlineRegion,
    advanced.mode,
    advanced.sortBy,
  ]);

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

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <div
        className="border-b border-black/[0.06]"
        style={{
          background: 'linear-gradient(115deg, #ffe4e1 0%, #fff8f7 55%, #ffffff 100%)',
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

      <main className="flex-1 max-w-[1060px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <SearchBreadcrumb
          subject={subjectQuery}
          regionLabel={onlineRegion ? '線上' : regionLabel}
          regionForPath={onlineRegion ? 'online' : regionSlug}
          className="mb-5"
        />

        <div>
          <h1 className="text-[32px] sm:text-[40px] font-black tracking-tight leading-tight text-[#1d1d1f]">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-[#6e6e73]">
            {isLoading
              ? '正在為你媒合最適合的老師…'
              : `顯示 ${tutors.length} 位導師 · 許多人提供第一堂課免費體驗`}
            {!isFromSupabase && !isLoading ? ' · 示範資料' : ''}
          </p>
        </div>

        {/* Superprof 頂部單一篩選列（無側邊欄） */}
        <div
          className="mt-6 flex flex-wrap items-center gap-2"
          role="region"
          aria-label="課程篩選"
        >
          {(
            [
              { id: 'all' as const, label: '全部' },
              { id: 'online' as const, label: '線上' },
              { id: 'in-person' as const, label: '面授' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setAdvanced((prev) => ({ ...prev, mode: chip.id }))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition cursor-pointer border ${
                advanced.mode === chip.id
                  ? 'bg-[#1a1a1a] text-white font-semibold border-[#1a1a1a]'
                  : 'bg-[#f5f5f5] text-[#5c5c5c] border-transparent hover:bg-[#ececec]'
              }`}
            >
              {chip.id === 'online' && <Monitor className="w-3 h-3" />}
              {chip.id === 'in-person' && <MapPin className="w-3 h-3" />}
              {chip.label}
            </button>
          ))}
          <label className="ml-auto inline-flex items-center gap-2 text-[12px] text-[#6e6e73]">
            <span className="hidden sm:inline">排序</span>
            <select
              value={advanced.sortBy}
              onChange={(e) =>
                setAdvanced((prev) => ({
                  ...prev,
                  sortBy: e.target.value as AdvancedFilterValues['sortBy'],
                }))
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

        <div className="mt-8">
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
              regionLabel={regionQuery ? regionLabel : undefined}
              subjectLabel={subjectQuery ? subjectLabel : undefined}
              onReset={() => setAdvanced(DEFAULT_ADVANCED_FILTERS)}
              onWiden={() => setAdvanced(DEFAULT_ADVANCED_FILTERS)}
            />
          )}
        </div>
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
          const { data: { session } } = await supabase.auth.getSession();
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
