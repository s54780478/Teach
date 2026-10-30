'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
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
  AdvancedFilterPanel,
  DEFAULT_ADVANCED_FILTERS,
  type AdvancedFilterValues,
} from '@/components/AdvancedFilterPanel';
import { EmptySearchState } from '@/components/EmptySearchState';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';

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

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const timer = window.setTimeout(() => {
      void searchTutors({
        region: regionQuery,
        subject: subjectQuery,
        minRate: advanced.minRate === '' ? undefined : advanced.minRate,
        maxRate: advanced.maxRate === '' ? undefined : advanced.maxRate,
        mode: advanced.mode,
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
  }, [regionSlug, subjectSlug, regionQuery, subjectQuery, advanced]);

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
    <div className="min-h-screen bg-[#0c0c0e] text-white flex flex-col">
      <div className="border-b border-white/5 bg-[#0c0c0e]">
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-1.5 text-xs text-white/45 mb-5">
          <Link href="/" className="hover:text-white transition">
            首頁
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/lessons/all/all" className="hover:text-white transition">
            課程探索
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/lessons/${encodeURIComponent(regionSlug)}/all`}
            className="hover:text-white transition"
          >
            {regionLabel}
          </Link>
          {subjectQuery && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white/80 font-medium">{subjectLabel}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {isLoading
                ? '正在從 Supabase 載入課程…'
                : `共 ${tutors.length} 門相關課程 · ${
                    isFromSupabase ? 'Supabase 即時資料' : '示範資料（降級）'
                  }`}
            </p>
          </div>
          <AdvancedFilterPanel
            value={advanced}
            onChange={setAdvanced}
            variant="dark"
            layout="trigger-only"
          />
        </div>

        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          <AdvancedFilterPanel
            value={advanced}
            onChange={setAdvanced}
            variant="dark"
            layout="sidebar-only"
          />

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
              </div>
            ) : tutors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
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
          selectedTutor
            ? `登入後即可開通 Student Pass，聯繫「${selectedTutor.name}」並查看 LINE／電話。`
            : null
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

      <SiteFooter variant="dark" />
    </div>
  );
};
