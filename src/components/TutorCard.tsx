'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Star,
  Zap,
  Gift,
  ShieldCheck,
  GraduationCap,
  Monitor,
  MapPin,
  Home,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { Tutor } from '@/types/tutor';
import { getTutorTrustFlags } from '@/lib/tutorTrust';
import {
  formatResponseLabel,
  teachingModeShortLabel,
  teachingModeTags,
} from '@/lib/tutorFilters';

interface TutorCardProps {
  tutor: Tutor;
  isUnlocked?: boolean;
  onContact: (tutor: Tutor) => void;
}

function ModeIcon({ tag }: { tag: string }) {
  if (tag.includes('線上')) return <Monitor className="w-2.5 h-2.5" />;
  if (tag.includes('到府')) return <Home className="w-2.5 h-2.5" />;
  return <MapPin className="w-2.5 h-2.5" />;
}

export const TutorCard: React.FC<TutorCardProps> = ({
  tutor,
  isUnlocked = false,
  onContact,
}) => {
  const [liked, setLiked] = useState(false);
  const trust = getTutorTrustFlags(tutor);
  const modeTags = teachingModeTags(tutor.mode, tutor.teachingModes);
  const modeShort = teachingModeShortLabel(tutor.mode, tutor.teachingModes);
  const responseLabel =
    tutor.responseTime || formatResponseLabel(tutor.responseSpeedMinutes);
  const showVerified = tutor.isVerified || trust.isVerified;
  const profileHref = `/tutor/${tutor.id}`;
  const ratingDisplay =
    tutor.reviews.reviewCount > 0 ? tutor.reviews.rating.toFixed(1) : null;

  return (
    <article className="group flex flex-col animate-fade-rise">
      <Link
        href={profileHref}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-800 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition shadow-[0_8px_30px_rgba(0,0,0,0.25)] group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        aria-label={`查看 ${tutor.name} 的公開履歷`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tutor.avatarUrl}
          alt={tutor.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

        <div className="absolute top-3 left-3 right-12 z-10 flex flex-col items-start gap-1.5">
          {tutor.firstLessonFree && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-brand-500 border border-brand-400/40 px-2.5 py-1 rounded-full shadow-lg shadow-brand-500/30">
              <Gift className="w-3 h-3" strokeWidth={2.5} />
              第一堂課免費
              {tutor.freeLessonMinutes ? ` ${tutor.freeLessonMinutes} 分` : ''}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            {trust.identityVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-200 bg-black/45 backdrop-blur-md border border-emerald-400/35 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                身分驗證
              </span>
            )}
            {trust.diplomaVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-200 bg-black/45 backdrop-blur-md border border-emerald-400/35 px-2 py-0.5 rounded-full">
                <GraduationCap className="w-3 h-3" />
                學歷認證
              </span>
            )}
            {showVerified && !trust.identityVerified && !trust.diplomaVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-200 bg-black/45 backdrop-blur-md border border-emerald-400/35 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                已驗證
              </span>
            )}
          </div>
        </div>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setLiked((v) => !v);
            }
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/90 hover:bg-black/45 hover:scale-105 transition cursor-pointer z-10"
          aria-label={liked ? '取消收藏' : '收藏'}
        >
          <Heart
            className={`w-4 h-4 transition ${liked ? 'fill-brand-500 text-brand-500 scale-110' : ''}`}
            strokeWidth={1.75}
          />
        </span>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="flex flex-wrap gap-1 mb-2">
            {modeTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-white/15 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded-full"
              >
                <ModeIcon tag={tag} />
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-2xl sm:text-[1.65rem] font-bold text-white tracking-tight drop-shadow-sm">
            {tutor.name}
          </h3>
          <p className="mt-0.5 text-sm text-white/80">({modeShort})</p>
        </div>
      </Link>

      <div className="pt-3.5 px-0.5 flex flex-col gap-2.5">
        <Link href={profileHref} className="block group/title space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 text-sm text-white/90">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              {ratingDisplay ? (
                <span className="font-bold tabular-nums">
                  {ratingDisplay}
                  <span className="text-white/45 font-normal">
                    {' '}
                    ({tutor.reviews.reviewCount})
                  </span>
                </span>
              ) : (
                <span className="font-medium text-white/75">新進活躍老師</span>
              )}
            </div>
            {trust.superTutor && (
              <span className="flex-shrink-0 text-[10px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/25 px-2 py-0.5 rounded-full">
                Super Tutor
              </span>
            )}
          </div>

          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-300/95">
            <Zap className="w-3 h-3 flex-shrink-0" />
            {responseLabel}
          </p>

          <p className="text-sm text-white/70 leading-snug line-clamp-2 min-h-[2.5rem] group-hover/title:text-white transition font-medium">
            {tutor.headline}
          </p>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="text-base font-bold text-white tabular-nums">
            NT$ {tutor.hourlyRate.toLocaleString()}
            <span className="text-sm font-semibold text-white/70">/小時</span>
          </span>
          {tutor.firstLessonFree && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-500">
              <Gift className="w-3.5 h-3.5" />
              第一堂課免費
            </span>
          )}
        </div>

        {isUnlocked ? (
          <div className="space-y-1.5">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100/95 space-y-1">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px]">
                  Student Pass
                </span>
                已解鎖聯絡方式
              </p>
              {tutor.contact.lineId && tutor.contact.lineId !== '未提供' && (
                <p className="truncate">
                  <span className="text-emerald-200/60">LINE</span>{' '}
                  <span className="font-semibold text-white">{tutor.contact.lineId}</span>
                </p>
              )}
              {tutor.contact.phone && tutor.contact.phone !== '未提供' && (
                <p className="truncate">
                  <span className="text-emerald-200/60">電話</span>{' '}
                  <a
                    href={`tel:${tutor.contact.phone}`}
                    className="font-semibold text-white hover:text-brand-500 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tutor.contact.phone}
                  </a>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onContact(tutor)}
              className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold py-2.5 rounded-full transition cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              開啟聯絡資訊
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onContact(tutor)}
              className="inline-flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold py-2.5 rounded-full transition cursor-pointer shadow-md shadow-brand-500/25"
              aria-label={`聯繫導師 ${tutor.name}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              聯繫導師
            </button>
            <button
              type="button"
              onClick={() => onContact(tutor)}
              className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-bold py-2.5 rounded-full transition cursor-pointer"
              aria-label={`預約 ${tutor.name} 的課程`}
            >
              <Calendar className="w-3.5 h-3.5" />
              預約課程
            </button>
          </div>
        )}

        {!isUnlocked && (
          <p className="text-center text-[10px] text-white/40 -mt-1">
            需 Student Pass 才能查看 LINE／電話
          </p>
        )}

        <Link
          href={profileHref}
          className="text-[11px] font-medium text-white/35 hover:text-white/70 transition self-center sm:self-start"
        >
          查看完整履歷與評價 →
        </Link>
      </div>
    </article>
  );
};
