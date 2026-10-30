'use client';

import React from 'react';
import { BadgeCheck, GraduationCap, ShieldCheck, Zap } from 'lucide-react';
import type { Tutor } from '@/types/tutor';
import { getTutorTrustFlags } from '@/lib/tutorTrust';

type BadgeSize = 'sm' | 'md';
type BadgeVariant = 'overlay' | 'light' | 'dark';

interface TrustBadgesProps {
  tutor: Tutor;
  size?: BadgeSize;
  variant?: BadgeVariant;
  /** 最多顯示幾個（卡片用較精簡） */
  max?: number;
  className?: string;
}

const SIZE: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-[11px] px-2.5 py-1 gap-1.5',
};

const ICON_SIZE: Record<BadgeSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
};

function chipClass(variant: BadgeVariant, tone: 'emerald' | 'sky' | 'amber' | 'brand') {
  if (variant === 'overlay') {
    const map = {
      emerald: 'bg-black/45 text-emerald-300 border-emerald-400/35 backdrop-blur-md',
      sky: 'bg-black/45 text-sky-300 border-sky-400/35 backdrop-blur-md',
      amber: 'bg-black/45 text-amber-200 border-amber-400/35 backdrop-blur-md',
      brand: 'bg-black/45 text-brand-500 border-brand-500/40 backdrop-blur-md',
    };
    return map[tone];
  }
  if (variant === 'light') {
    const map = {
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      sky: 'bg-sky-50 text-sky-700 border-sky-200',
      amber: 'bg-amber-50 text-amber-800 border-amber-200',
      brand: 'bg-brand-50 text-brand-600 border-brand-200',
    };
    return map[tone];
  }
  const map = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    amber: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
    brand: 'bg-brand-500/15 text-brand-500 border-brand-500/30',
  };
  return map[tone];
}

/** Superprof 式信任標籤列 */
export const TrustBadges: React.FC<TrustBadgesProps> = ({
  tutor,
  size = 'sm',
  variant = 'dark',
  max = 4,
  className = '',
}) => {
  const flags = getTutorTrustFlags(tutor);
  const iconCls = ICON_SIZE[size];

  const items: { key: string; label: string; tone: 'emerald' | 'sky' | 'amber' | 'brand'; icon: React.ReactNode }[] = [];

  if (flags.isVerified) {
    items.push({
      key: 'verified',
      label: flags.identityVerified ? '身份已驗證' : '學歷已驗證',
      tone: 'emerald',
      icon: flags.identityVerified ? (
        <ShieldCheck className={iconCls} strokeWidth={2.25} />
      ) : (
        <GraduationCap className={iconCls} strokeWidth={2.25} />
      ),
    });
  }

  if (flags.superTutor) {
    items.push({
      key: 'super',
      label: 'Super Tutor',
      tone: 'amber',
      icon: <BadgeCheck className={iconCls} strokeWidth={2.25} />,
    });
  } else if (flags.fastResponse) {
    items.push({
      key: 'fast',
      label: '超快回覆',
      tone: 'sky',
      icon: <Zap className={iconCls} strokeWidth={2.25} />,
    });
  }

  if (flags.identityVerified && flags.diplomaVerified && items.length < max) {
    items.push({
      key: 'diploma',
      label: '學歷已驗證',
      tone: 'emerald',
      icon: <GraduationCap className={iconCls} strokeWidth={2.25} />,
    });
  }

  if (flags.firstLessonFree && items.length < max) {
    items.push({
      key: 'free',
      label: '首堂免費',
      tone: 'brand',
      icon: <BadgeCheck className={iconCls} strokeWidth={2.25} />,
    });
  }

  const visible = items.slice(0, max);
  if (visible.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="信任標示">
      {visible.map((item) => (
        <li
          key={item.key}
          className={`inline-flex items-center rounded-full border font-semibold tracking-tight ${SIZE[size]} ${chipClass(variant, item.tone)}`}
        >
          {item.icon}
          {item.label}
        </li>
      ))}
    </ul>
  );
};
