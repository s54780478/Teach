'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Search, Sparkles, Monitor } from 'lucide-react';

interface EmptySearchStateProps {
  regionLabel?: string;
  subjectLabel?: string;
  onReset?: () => void;
  onWiden?: () => void;
  className?: string;
}

/** Superprof 風格友善空結果狀態（淺色） */
export const EmptySearchState: React.FC<EmptySearchStateProps> = ({
  regionLabel,
  subjectLabel,
  onReset,
  onWiden,
  className = '',
}) => {
  const hasContext = Boolean(regionLabel || subjectLabel);
  const contextBits = [subjectLabel, regionLabel].filter(Boolean);
  const title = hasContext
    ? `目前沒有符合「${contextBits.join(' · ')}」的導師`
    : '找不到符合條件的私人老師';
  const detail = hasContext
    ? '試試改為線上授課、放寬篩選，或瀏覽全台熱門課程。許多導師提供第一堂課免費體驗。'
    : '請嘗試更換科目、地區，或清除篩選後再搜尋。';

  return (
    <div
      className={`rounded-3xl border border-black/[0.06] bg-[#fafafa] px-6 py-14 sm:py-16 text-center max-w-lg mx-auto ${className}`}
      role="status"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-5">
        <Search className="w-6 h-6 text-brand-500" strokeWidth={1.75} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-[#6b6b6b] leading-relaxed max-w-sm mx-auto">{detail}</p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        {(onWiden || onReset) && (
          <button
            type="button"
            onClick={onWiden || onReset}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold px-5 py-2.5 rounded-full transition cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            清除篩選並重試
          </button>
        )}
        <Link
          href="/lessons/all/線上"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5c5c] hover:text-[#1a1a1a] px-4 py-2.5 rounded-full border border-black/10 hover:bg-black/[0.03] transition"
        >
          <Monitor className="w-4 h-4 text-brand-500" />
          改看線上課程
        </Link>
        <Link
          href="/lessons/all/all"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5c5c] hover:text-[#1a1a1a] px-4 py-2.5 rounded-full border border-black/10 hover:bg-black/[0.03] transition"
        >
          <Sparkles className="w-4 h-4 text-brand-500" />
          瀏覽全台熱門
        </Link>
      </div>
    </div>
  );
};
