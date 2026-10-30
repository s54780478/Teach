'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Search, Sparkles } from 'lucide-react';

interface EmptySearchStateProps {
  regionLabel?: string;
  subjectLabel?: string;
  onReset?: () => void;
  onWiden?: () => void;
  className?: string;
}

/** Superprof 風格友善空結果狀態 */
export const EmptySearchState: React.FC<EmptySearchStateProps> = ({
  regionLabel,
  subjectLabel,
  onReset,
  onWiden,
  className = '',
}) => {
  const hasContext = Boolean(regionLabel || subjectLabel);
  const title = hasContext
    ? '目前該地區尚無此科目導師'
    : '找不到符合條件的課程';
  const detail = hasContext
    ? `「${[regionLabel, subjectLabel].filter(Boolean).join(' · ')}」暫無上架結果，試試擴大搜尋範圍或改為線上教學。`
    : '請嘗試放寬時薪、授課方式或切換地區、科目篩選。';

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 py-14 sm:py-16 text-center max-w-lg mx-auto animate-fade-rise ${className}`}
      role="status"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mb-5">
        <Search className="w-6 h-6 text-brand-500" strokeWidth={1.75} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-sm mx-auto">{detail}</p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        {(onWiden || onReset) && (
          <button
            type="button"
            onClick={onWiden || onReset}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-bold px-5 py-2.5 rounded-full transition shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            擴大搜尋範圍
          </button>
        )}
        <Link
          href="/lessons/all/all"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white px-4 py-2.5 rounded-full border border-white/15 hover:bg-white/5 transition"
        >
          <Sparkles className="w-4 h-4 text-brand-500" />
          瀏覽全台熱門課程
        </Link>
      </div>
    </div>
  );
};
