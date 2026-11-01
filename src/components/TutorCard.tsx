'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, Gift, MessageCircle } from 'lucide-react';
import { Tutor } from '@/types/tutor';
import { getTutorTrustFlags } from '@/lib/tutorTrust';
import { teachingModeShortLabel } from '@/lib/tutorFilters';
import { isDemoTutorId } from '@/lib/tutorService';

interface TutorCardProps {
  tutor: Tutor;
  isUnlocked?: boolean;
  onContact: (tutor: Tutor) => void;
}

/** Superprof 卡片：圓角方圖 + 圖下評分／簡介（緊湊、不過度拉高） */
export const TutorCard: React.FC<TutorCardProps> = ({
  tutor,
  isUnlocked = false,
  onContact,
}) => {
  const [liked, setLiked] = useState(false);
  const trust = getTutorTrustFlags(tutor);
  const isDemo = isDemoTutorId(tutor.id);
  const modeShort = teachingModeShortLabel(tutor.mode, tutor.teachingModes);
  const profileHref = `/tutor/${tutor.id}`;
  const ratingDisplay =
    tutor.reviews.reviewCount > 0 ? tutor.reviews.rating.toFixed(1) : null;

  return (
    <article className="group flex flex-col">
      <Link
        href={profileHref}
        className="relative aspect-square w-full overflow-hidden rounded-[28px] sm:rounded-[32px] bg-[#f5f5f7] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6363] transition"
        aria-label={`查看 ${tutor.name} 的公開履歷`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tutor.avatarUrl}
          alt={tutor.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 items-start max-w-[70%]">
          {isDemo && (
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wide text-white/95 bg-black/55 backdrop-blur-[2px] px-2 py-0.5 rounded-full">
              示範
            </span>
          )}
          {tutor.firstLessonFree && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#FF6363] px-2.5 py-1 rounded-full shadow-sm">
              第一堂課免費
            </span>
          )}
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/35 backdrop-blur-[2px] flex items-center justify-center text-white hover:bg-black/50 transition cursor-pointer z-10"
          aria-label={liked ? '取消收藏' : '收藏'}
        >
          <Heart
            className={`w-4 h-4 ${liked ? 'fill-[#FF6363] text-[#FF6363]' : ''}`}
            strokeWidth={1.75}
          />
        </span>

        <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4">
          <h3 className="text-on-media text-[22px] sm:text-[24px] font-bold leading-8">
            {tutor.name}
          </h3>
          <p className="text-on-media-muted text-[13px] sm:text-[14px] leading-5 opacity-95">
            ({modeShort})
          </p>
        </div>
      </Link>

      <div className="pt-2.5 px-0.5 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 min-h-[24px]">
          <div className="flex items-center gap-1.5 text-[14px] text-[#121212]">
            <Star className="w-3.5 h-3.5 fill-[#FF6363] text-[#FF6363] flex-shrink-0" />
            {ratingDisplay ? (
              <span className="font-semibold tabular-nums">
                {ratingDisplay}
                <span className="text-[#6e6e73] font-normal"> ({tutor.reviews.reviewCount})</span>
              </span>
            ) : (
              <span className="text-[#6e6e73]">新進活躍老師</span>
            )}
          </div>
          {trust.superTutor && !isDemo && (
            <span className="text-[13px] font-semibold text-[#5e5ce6]">Ambassador</span>
          )}
        </div>

        <Link href={profileHref}>
          <p className="text-[14px] text-[#424245] leading-snug line-clamp-2 min-h-[40px]">
            {tutor.headline}
          </p>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2 pt-0.5">
          <span className="text-[15px] font-bold text-[#1d1d1f] tabular-nums">
            NT$ {tutor.hourlyRate.toLocaleString()}
            <span className="text-[13px] font-medium text-[#6e6e73]">/小時</span>
          </span>
          {tutor.firstLessonFree && (
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#FF6363]">
              <Gift className="w-3.5 h-3.5" />
              第一堂課免費
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onContact(tutor)}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-[#FF6363] hover:bg-[#ff5252] text-white text-[14px] font-semibold h-10 rounded-full transition cursor-pointer"
          aria-label={`聯繫導師 ${tutor.name}`}
        >
          <MessageCircle className="w-4 h-4" />
          {isUnlocked ? '查看聯絡方式' : '聯繫導師'}
        </button>
      </div>
    </article>
  );
};
