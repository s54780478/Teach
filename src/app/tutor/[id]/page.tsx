'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  GraduationCap,
  ShieldCheck,
  Zap,
  BookOpen,
  Monitor,
  Home,
  Loader2,
  MessageCircle,
  Phone,
  Gift,
  Calendar,
} from 'lucide-react';
import type { Tutor } from '@/types/tutor';
import { getTutorById, getTutors } from '@/lib/tutorService';
import {
  buildTutorTestimonials,
  teachingModeDetails,
} from '@/lib/tutorTestimonials';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { StudentPassModal } from '@/components/StudentPassModal';
import { ContactViewModal } from '@/components/ContactViewModal';
import { UnlockedTutorsDrawer } from '@/components/UnlockedTutorsDrawer';
import { TrustBadges } from '@/components/TrustBadges';
import { SiteFooter } from '@/components/SiteFooter';
import { LogoHomeLink } from '@/components/LogoHomeLink';
import { getTutorTrustFlags } from '@/lib/tutorTrust';
import { useStudentPass } from '@/hooks/useStudentPass';
import { teachingModeTags } from '@/lib/tutorFilters';
import { DEFAULT_RESPONSE_TIME } from '@/lib/teachingModes';
import { authIntentForTutor, PASS_UNLOCK_HINT } from '@/lib/contactFlowCopy';

export default function TutorPublicProfilePage() {
  const params = useParams();
  const tutorId = typeof params?.id === 'string' ? params.id : '';

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isContactedDrawerOpen, setIsContactedDrawerOpen] = useState(false);
  const [pendingContact, setPendingContact] = useState(false);

  useEffect(() => {
    if (!tutorId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    void Promise.all([getTutorById(tutorId), getTutors()]).then(([result, list]) => {
      if (cancelled) return;
      if (!result.tutor) {
        setNotFound(true);
        setTutor(null);
      } else {
        setTutor(result.tutor);
        setNotFound(false);
      }
      setAllTutors(list.tutors);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  const testimonials = useMemo(
    () => (tutor ? buildTutorTestimonials(tutor) : []),
    [tutor]
  );
  const modeInfo = useMemo(
    () => (tutor ? teachingModeDetails(tutor.mode) : null),
    [tutor]
  );

  const openContactFlow = () => {
    if (!tutor) return;
    if (!currentUser) {
      setPendingContact(true);
      setIsAuthModalOpen(true);
      return;
    }
    if (!studentPass.active) {
      setPendingContact(true);
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
    setIsAuthModalOpen(false);
    const pass = await hydrate(user.id);
    if (pendingContact) {
      if (pass.active && tutor) {
        markContacted(tutor.id);
        setIsContactModalOpen(true);
        setPendingContact(false);
      } else {
        setIsPassModalOpen(true);
      }
    }
  };

  const handleSubscribePass = async (
    card?: Parameters<typeof subscribe>[0]
  ) => {
    const next = await subscribe(card);
    if (!next.active) return;
    setIsPassModalOpen(false);
    if (tutor && pendingContact) {
      markContacted(tutor.id);
      setIsContactModalOpen(true);
      setPendingContact(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    );
  }

  if (notFound || !tutor || !modeInfo) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold">找不到這位導師</h1>
        <p className="text-sm text-[#6e6e73] mt-2">課程可能已下架或連結有誤</p>
        <LogoHomeLink className="mt-6 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-full transition">
          <ArrowLeft className="w-4 h-4" />
          回首頁探索課程
        </LogoHomeLink>
      </div>
    );
  }

  const stars = Math.round(tutor.reviews.rating);
  const trust = getTutorTrustFlags(tutor);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col">
      <div
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

      <main className="flex-1 pb-24 lg:pb-0">
        {/* Hero */}
        <section className="relative border-b border-black/[0.06] bg-white">
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 sm:pb-12">
            <Link
              href="/#tutors"
              className="inline-flex items-center gap-1.5 text-sm text-[#6e6e73] hover:text-[#1a1a1a] transition mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              返回課程列表
            </Link>

            <div className="flex flex-col md:flex-row gap-8 md:gap-10 md:items-start">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[26px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex-shrink-0 mx-auto md:mx-0 bg-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                  <TrustBadges tutor={tutor} size="md" variant="light" max={4} />
                  {tutor.badge && !trust.superTutor && (
                    <span className="text-[11px] font-semibold text-[#5c5c5c] bg-[#f5f5f5] px-2.5 py-1 rounded-full">
                      {tutor.badge}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">
                  {tutor.name}
                </h1>
                <p className="mt-2 text-base sm:text-lg text-[#5c5c5c] leading-snug max-w-2xl mx-auto md:mx-0">
                  {tutor.headline}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                  {teachingModeTags(tutor.mode, tutor.teachingModes).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5c5c5c] bg-[#f5f5f5] px-2.5 py-1 rounded-full"
                    >
                      {tag.includes('線上') ? (
                        <Monitor className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {tag}
                    </span>
                  ))}
                  {tutor.firstLessonFree && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-brand-500 px-2.5 py-1 rounded-full">
                      <Gift className="w-3 h-3" />
                      第一堂課免費
                      {tutor.freeLessonMinutes ? ` ${tutor.freeLessonMinutes} 分` : ''}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-[#5c5c5c]">
                  <span className="inline-flex items-center gap-1.5 text-[#1a1a1a] font-semibold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-[#d4d4d4]'
                        }`}
                      />
                    ))}
                    <span className="ml-1">{tutor.reviews.rating.toFixed(1)}</span>
                    <span className="text-[#6e6e73] font-normal">
                      ({tutor.reviews.reviewCount} 則評價)
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    {tutor.location.displayLocation}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    {tutor.responseTime || DEFAULT_RESPONSE_TIME}
                  </span>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center md:items-end gap-3 sm:gap-4">
                  <div>
                    <p className="text-[11px] text-[#6e6e73] font-medium">時薪</p>
                    <p className="text-3xl font-black tabular-nums tracking-tight">
                      NT$ {tutor.hourlyRate.toLocaleString()}
                      <span className="text-base font-semibold text-[#6e6e73]">/小時</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openContactFlow}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold px-6 py-3.5 rounded-full transition shadow-lg shadow-brand-500/25 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {studentPass.active ? '聯繫導師' : '聯繫導師'}
                  </button>
                  <button
                    type="button"
                    onClick={openContactFlow}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#f5f5f5] hover:bg-[#ececec] border border-black/10 text-[#1a1a1a] text-sm font-bold px-6 py-3.5 rounded-full transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    預約課程
                  </button>
                </div>

                {studentPass.active ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-left max-w-md mx-auto md:mx-0">
                    <p className="text-[11px] font-bold text-emerald-700 mb-2">Student Pass 已解鎖</p>
                    <div className="space-y-1.5 text-sm text-[#1a1a1a]">
                      {tutor.contact.lineId && tutor.contact.lineId !== '未提供' && (
                        <p className="flex items-center gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          LINE：<span className="font-semibold">{tutor.contact.lineId}</span>
                        </p>
                      )}
                      {tutor.contact.phone && tutor.contact.phone !== '未提供' && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          電話：
                          <a href={`tel:${tutor.contact.phone}`} className="font-semibold hover:text-brand-500">
                            {tutor.contact.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-[#6e6e73]">{PASS_UNLOCK_HINT}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-8">
            <ProfileBlock title="關於我" icon={<BookOpen className="w-4 h-4" />}>
              <p className="text-sm sm:text-[15px] text-[#5c5c5c] leading-relaxed whitespace-pre-line">
                {tutor.bio}
              </p>
              {tutor.specialtyTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {tutor.specialtyTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium text-[#5c5c5c] bg-white/5 border border-black/[0.08] px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </ProfileBlock>

            <ProfileBlock title="教學經歷與學歷" icon={<GraduationCap className="w-4 h-4" />}>
              <ul className="space-y-3 text-sm text-[#5c5c5c]">
                <li className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">學歷背景</p>
                    <p className="mt-0.5">{tutor.verification.degree}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">主修／科目分類</p>
                    <p className="mt-0.5">{tutor.subjectCategory}</p>
                  </div>
                </li>
                {typeof tutor.taughtHours === 'number' && tutor.taughtHours > 0 && (
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">累計授課時數</p>
                      <p className="mt-0.5">約 {tutor.taughtHours.toLocaleString()} 小時實務教學經驗</p>
                    </div>
                  </li>
                )}
              </ul>
            </ProfileBlock>

            <ProfileBlock title="學生評價" icon={<Star className="w-4 h-4" />}>
              <div className="space-y-3">
                {testimonials.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-black/[0.08] bg-[#fafafa] p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-[#1a1a1a]">{review.studentName}</p>
                      <span className="text-[11px] text-[#6e6e73]">{review.dateLabel}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-[#e0e0e0]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-[#5c5c5c] leading-relaxed">{review.content}</p>
                  </article>
                ))}
              </div>
            </ProfileBlock>
          </div>

          {/* Sticky side CTA */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-black/[0.08] bg-[#fafafa] p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-[#6e6e73] tracking-wide mb-2.5">平台信任標示</p>
                <ul className="space-y-2.5">
                  {trust.isVerified && (
                    <li className="flex items-start gap-2.5 text-sm text-[#5c5c5c]">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-[#1a1a1a]">身份／學歷已驗證</span>
                        <span className="block text-xs text-[#6e6e73] mt-0.5">官方查驗頂大學歷或專業證照</span>
                      </span>
                    </li>
                  )}
                  {(trust.superTutor || trust.fastResponse) && (
                    <li className="flex items-start gap-2.5 text-sm text-[#5c5c5c]">
                      <Zap className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-[#1a1a1a]">
                          {trust.superTutor ? 'Super Tutor' : '超快回覆'}
                        </span>
                        <span className="block text-xs text-[#6e6e73] mt-0.5">
                          {tutor.responseTime || DEFAULT_RESPONSE_TIME}
                        </span>
                      </span>
                    </li>
                  )}
                  {trust.firstLessonFree && (
                    <li className="flex items-start gap-2.5 text-sm text-[#5c5c5c]">
                      <Gift className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-[#1a1a1a]">第一堂課免費</span>
                        <span className="block text-xs text-[#6e6e73] mt-0.5">
                          導師個人設定
                          {tutor.freeLessonMinutes
                            ? ` · ${tutor.freeLessonMinutes} 分鐘體驗`
                            : ''}
                        </span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-3 border-t border-black/[0.08]">
                <ProfileBlock
                  title="授課方式"
                  icon={<Monitor className="w-4 h-4" />}
                  compact
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {teachingModeTags(tutor.mode, tutor.teachingModes).map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold text-[#1a1a1a]/80 bg-[#f5f5f5] border border-black/10 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-2">{modeInfo?.title}</p>
                  <ul className="space-y-2">
                    {(modeInfo?.items || []).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#5c5c5c]">
                        <Home className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </ProfileBlock>
              </div>

              <div className="pt-2 border-t border-black/[0.08] space-y-2">
                <p className="text-2xl font-black tabular-nums">
                  NT$ {tutor.hourlyRate.toLocaleString()}
                  <span className="text-sm font-semibold text-[#6e6e73]">/小時</span>
                </p>
                <button
                  type="button"
                  onClick={openContactFlow}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold py-3.5 rounded-full transition cursor-pointer shadow-lg shadow-brand-500/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  聯繫導師
                </button>
                <button
                  type="button"
                  onClick={openContactFlow}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#f5f5f5] hover:bg-[#ececec] border border-black/10 text-[#1a1a1a] text-sm font-bold py-3 rounded-full transition cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  預約課程
                </button>
                <p className="text-[11px] text-center text-[#6e6e73]">
                  {studentPass.active
                    ? 'Student Pass 通行中'
                    : '解鎖全平台聯繫 · 可隨時取消'}
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-black/[0.08] bg-white/95 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#6e6e73]">時薪</p>
              <p className="text-sm font-bold text-[#1a1a1a] tabular-nums truncate">
                NT$ {tutor.hourlyRate.toLocaleString()}/小時
              </p>
            </div>
            <button
              type="button"
              onClick={openContactFlow}
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-full cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              聯繫導師
            </button>
            <button
              type="button"
              onClick={openContactFlow}
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 bg-[#f5f5f5] border border-black/10 text-[#1a1a1a] text-xs font-bold px-3 py-2.5 rounded-full cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              預約
            </button>
          </div>
        </div>
      </main>

      <SiteFooter variant="light" />

      <StudentPassModal
        isOpen={isPassModalOpen}
        pass={studentPass}
        onClose={() => {
          setIsPassModalOpen(false);
          setPendingContact(false);
        }}
        onSubscribe={handleSubscribePass}
        onCancelPass={async () => {
          await cancelPass();
          setIsContactModalOpen(false);
        }}
        tutorName={tutor?.name}
      />

      {isContactModalOpen && studentPass.active && (
        <ContactViewModal
          tutor={tutor}
          onClose={() => setIsContactModalOpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingContact(false);
        }}
        onSuccess={handleAuthSuccess}
        intentHint={
          pendingContact && tutor ? authIntentForTutor(tutor.name) : null
        }
      />

      <UnlockedTutorsDrawer
        isOpen={isContactedDrawerOpen}
        onClose={() => setIsContactedDrawerOpen(false)}
        tutors={allTutors.length > 0 ? allTutors : tutor ? [tutor] : []}
        unlockedIds={contactedTutorIds}
      />
    </div>
  );
}

function ProfileBlock({
  title,
  icon,
  children,
  compact = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'rounded-2xl border border-black/[0.08] bg-[#fafafa] p-5 sm:p-6'}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-brand-500">{icon}</span>
        <h2 className="text-sm font-bold text-[#1a1a1a] tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}
