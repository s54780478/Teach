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
import { getTutorTrustFlags } from '@/lib/tutorTrust';
import { useStudentPass } from '@/hooks/useStudentPass';

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
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    );
  }

  if (notFound || !tutor || !modeInfo) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-xl font-bold">找不到這位導師</h1>
        <p className="text-sm text-white/50 mt-2">課程可能已下架或連結有誤</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-full transition"
        >
          <ArrowLeft className="w-4 h-4" />
          回首頁探索課程
        </Link>
      </div>
    );
  }

  const stars = Math.round(tutor.reviews.rating);
  const trust = getTutorTrustFlags(tutor);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex flex-col">
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

      <main className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-white/5">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 20% 20%, rgba(255,90,95,0.18), transparent 55%)',
            }}
          />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10 sm:pb-12">
            <Link
              href="/#tutors"
              className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white transition mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              返回課程列表
            </Link>

            <div className="flex flex-col md:flex-row gap-8 md:gap-10 md:items-start">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden ring-2 ring-white/10 shadow-2xl flex-shrink-0 mx-auto md:mx-0 bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                  <TrustBadges tutor={tutor} size="md" variant="dark" max={4} />
                  {tutor.badge && !trust.superTutor && (
                    <span className="text-[11px] font-semibold text-white/70 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                      {tutor.badge}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{tutor.name}</h1>
                <p className="mt-2 text-base sm:text-lg text-white/70 leading-snug max-w-2xl mx-auto md:mx-0">
                  {tutor.headline}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-white/70">
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                    <span className="ml-1">{tutor.reviews.rating.toFixed(1)}</span>
                    <span className="text-white/40 font-normal">
                      ({tutor.reviews.reviewCount} 則評價)
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    {tutor.location.displayLocation}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    {trust.fastResponse ? '超快回覆 · ' : ''}約 {tutor.responseSpeedMinutes} 分鐘
                  </span>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center md:items-end gap-4 sm:gap-6">
                  <div>
                    <p className="text-[11px] text-white/40 font-medium">時薪</p>
                    <p className="text-3xl font-black tabular-nums tracking-tight">
                      ${tutor.hourlyRate.toLocaleString()}
                      <span className="text-base font-semibold text-white/50">/小時</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openContactFlow}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold px-7 py-3.5 rounded-full transition shadow-lg shadow-brand-500/25 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {studentPass.active ? '開啟聯絡卡片' : '解鎖聯絡方式'}
                  </button>
                </div>

                {studentPass.active ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-left max-w-md mx-auto md:mx-0">
                    <p className="text-[11px] font-bold text-emerald-300 mb-2">Student Pass 已解鎖</p>
                    <div className="space-y-1.5 text-sm text-white/90">
                      {tutor.contact.lineId && (
                        <p className="flex items-center gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          LINE：<span className="font-semibold">{tutor.contact.lineId}</span>
                        </p>
                      )}
                      {tutor.contact.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          電話：
                          <a href={`tel:${tutor.contact.phone}`} className="font-semibold hover:text-brand-500">
                            {tutor.contact.phone}
                          </a>
                        </p>
                      )}
                      {tutor.contact.email && (
                        <p className="text-xs text-white/50 truncate">Email：{tutor.contact.email}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-white/40">
                    需 Student Pass 即可無限次聯繫全台導師
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-8">
            <ProfileBlock title="關於我" icon={<BookOpen className="w-4 h-4" />}>
              <p className="text-sm sm:text-[15px] text-white/70 leading-relaxed whitespace-pre-line">
                {tutor.bio}
              </p>
              {tutor.specialtyTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {tutor.specialtyTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium text-white/75 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </ProfileBlock>

            <ProfileBlock title="教學經歷與學歷" icon={<GraduationCap className="w-4 h-4" />}>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">學歷背景</p>
                    <p className="mt-0.5">{tutor.verification.degree}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">主修／科目分類</p>
                    <p className="mt-0.5">{tutor.subjectCategory}</p>
                  </div>
                </li>
                {typeof tutor.taughtHours === 'number' && tutor.taughtHours > 0 && (
                  <li className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">累計授課時數</p>
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
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-white">{review.studentName}</p>
                      <span className="text-[11px] text-white/35">{review.dateLabel}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-white/15'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed">{review.content}</p>
                  </article>
                ))}
              </div>
            </ProfileBlock>
          </div>

          {/* Sticky side CTA */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-white/40 tracking-wide mb-2.5">平台信任標示</p>
                <ul className="space-y-2.5">
                  {trust.isVerified && (
                    <li className="flex items-start gap-2.5 text-sm text-white/75">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-white">身份／學歷已驗證</span>
                        <span className="block text-xs text-white/40 mt-0.5">官方查驗頂大學歷或專業證照</span>
                      </span>
                    </li>
                  )}
                  {(trust.superTutor || trust.fastResponse) && (
                    <li className="flex items-start gap-2.5 text-sm text-white/75">
                      <Zap className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-white">
                          {trust.superTutor ? 'Super Tutor' : '超快回覆'}
                        </span>
                        <span className="block text-xs text-white/40 mt-0.5">
                          平均約 {tutor.responseSpeedMinutes} 分鐘內回覆家長訊息
                        </span>
                      </span>
                    </li>
                  )}
                  {trust.firstLessonFree && (
                    <li className="flex items-start gap-2.5 text-sm text-white/75">
                      <GraduationCap className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-semibold text-white">首堂免費試教</span>
                        <span className="block text-xs text-white/40 mt-0.5">降低試錯成本，放心解鎖聯繫</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-3 border-t border-white/10">
                <ProfileBlock
                  title="授課方式"
                  icon={<Monitor className="w-4 h-4" />}
                  compact
                >
                  <p className="text-sm font-semibold text-white mb-2">{modeInfo.title}</p>
                  <ul className="space-y-2">
                    {modeInfo.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-white/65">
                        <Home className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </ProfileBlock>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-2xl font-black tabular-nums">
                  NT$ {tutor.hourlyRate.toLocaleString()}
                  <span className="text-sm font-semibold text-white/45">/小時</span>
                </p>
                <button
                  type="button"
                  onClick={openContactFlow}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold py-3.5 rounded-full transition cursor-pointer shadow-lg shadow-brand-500/20"
                >
                  {studentPass.active ? '聯繫導師' : '解鎖聯絡方式'}
                </button>
                <p className="mt-2 text-[11px] text-center text-white/35">
                  {studentPass.active
                    ? 'Student Pass 通行中'
                    : '訂閱 Student Pass 後無限次聯繫'}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter variant="dark" />

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
          pendingContact && tutor
            ? `登入後即可開通 Student Pass，聯繫「${tutor.name}」並查看 LINE／電話。`
            : null
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
    <div className={compact ? '' : 'rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6'}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-brand-500">{icon}</span>
        <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}
