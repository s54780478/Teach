'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Monitor, MapPin } from 'lucide-react';
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

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {isLoading
              ? '正在載入課程…'
              : `共 ${tutors.length} 門相關課程 · 許多導師提供首堂免費體驗`}
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
                  ? 'bg-white text-slate-900 font-semibold border-white'
                  : 'bg-transparent text-white/65 border-white/15 hover:border-white/30'
              }`}
            >
              {chip.id === 'online' && <Monitor className="w-3 h-3" />}
              {chip.id === 'in-person' && <MapPin className="w-3 h-3" />}
              {chip.label}
            </button>
          ))}
          <label className="ml-auto inline-flex items-center gap-2 text-[11px] text-white/40">
            排序
            <select
              value={advanced.sortBy}
              onChange={(e) =>
                setAdvanced((prev) => ({
                  ...prev,
                  sortBy: e.target.value as AdvancedFilterValues['sortBy'],
                }))
              }
              aria-label="排序方式"
              className="bg-white/5 border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/85 font-medium focus:outline-none cursor-pointer"
            >
              <option value="recommended" className="text-slate-900">
                推薦
              </option>
              <option value="rating" className="text-slate-900">
                評價最高
              </option>
              <option value="price-asc" className="text-slate-900">
                時薪：低到高
              </option>
              <option value="price-desc" className="text-slate-900">
                時薪：高到低
              </option>
            </select>
          </label>
        </div>

        <div className="mt-8">
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
