'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, Zap } from 'lucide-react';
import { Tutor } from '@/types/tutor';
import { TrustBadges } from '@/components/TrustBadges';
import { getTutorTrustFlags } from '@/lib/tutorTrust';

interface TutorCardProps {
  tutor: Tutor;
  isUnlocked?: boolean;
  onContact: (tutor: Tutor) => void;
}

export const TutorCard: React.FC<TutorCardProps> = ({
  tutor,
  isUnlocked = false,
  onContact,
}) => {
  const [liked, setLiked] = useState(false);
  const trust = getTutorTrustFlags(tutor);

  const modeLabel =
    tutor.mode === 'online'
      ? '視訊'
      : tutor.mode === 'in-person'
        ? '實體課程'
        : '實體課程&視訊';

  const profileHref = `/tutor/${tutor.id}`;

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <div className="absolute top-3 left-3 right-12 z-10">
          <TrustBadges tutor={tutor} size="sm" variant="overlay" max={2} />
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
          <h3 className="text-2xl sm:text-[1.65rem] font-bold text-white tracking-tight drop-shadow-sm">
            {tutor.name}
          </h3>
          <p className="mt-0.5 text-sm text-white/85 flex items-center gap-1.5">
            ({modeLabel})
            {trust.fastResponse && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-300">
                <Zap className="w-3 h-3" />
                {tutor.responseSpeedMinutes}分回覆
              </span>
            )}
          </p>
        </div>
      </Link>

      <div className="pt-3.5 px-0.5 flex flex-col gap-2">
        <Link href={profileHref} className="block group/title">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 text-sm text-white/90">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              {tutor.reviews.reviewCount > 0 ? (
                <span className="font-medium truncate">
                  {tutor.reviews.rating.toFixed(0)}
                  <span className="text-white/50 font-normal">
                    {' '}
                    ({tutor.reviews.reviewCount}則評論)
                  </span>
                </span>
              ) : (
                <span className="font-medium text-white/80">活躍老師</span>
              )}
            </div>
            {trust.superTutor && (
              <span className="flex-shrink-0 text-[11px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/25 px-2 py-0.5 rounded-full">
                Super Tutor
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-white/55 leading-snug line-clamp-2 min-h-[2.5rem] group-hover/title:text-white/75 transition">
            {tutor.headline}
          </p>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pt-0.5">
          <span className="text-base font-bold text-white tabular-nums">
            NT$ {tutor.hourlyRate.toLocaleString()}
            <span className="text-sm font-semibold text-white/70">/小時</span>
          </span>
          {tutor.firstLessonFree && (
            <span className="text-sm font-semibold text-brand-500">第一堂課免費試聽</span>
          )}
        </div>

        {isUnlocked ? (
          <div className="mt-1 space-y-1.5">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100/95 space-y-1">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px]">
                  Student Pass
                </span>
                已解鎖聯絡方式
              </p>
              {tutor.contact.lineId && (
                <p className="truncate">
                  <span className="text-emerald-200/60">LINE</span>{' '}
                  <span className="font-semibold text-white">{tutor.contact.lineId}</span>
                </p>
              )}
              {tutor.contact.phone && (
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
              className="self-start text-[11px] font-semibold text-white/55 hover:text-white transition cursor-pointer"
            >
              開啟完整聯絡卡片 →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onContact(tutor)}
            className="mt-1 self-start text-xs font-semibold text-white/75 hover:text-brand-500 transition cursor-pointer text-left leading-snug"
          >
            解鎖聯絡方式
            <span className="block text-[10px] font-medium text-white/40 mt-0.5">
              需 Student Pass
            </span>
          </button>
        )}

        <Link
          href={profileHref}
          className="text-[11px] font-medium text-white/35 hover:text-white/70 transition self-start"
        >
          查看完整履歷 →
        </Link>
      </div>
    </article>
  );
};
