'use client';

import React from 'react';
import Link from 'next/link';
import { subjectBreadcrumbParts } from '@/data/subjectTaxonomy';
import { buildLessonsPath } from '@/lib/seoRoutes';
import { LogoHomeLink } from '@/components/LogoHomeLink';

interface SearchBreadcrumbProps {
  /** 目前科目關鍵字（例：唱歌） */
  subject?: string;
  /** 地區顯示名；空則不顯示地區層 */
  regionLabel?: string;
  /** 地區 slug／查詢字串，供連結用 */
  regionForPath?: string;
  className?: string;
}

/**
 * Superprof 式麵包屑：idaltu > 音樂 > 唱歌
 * 以 `>` 分隔，對比足夠可讀。
 */
export const SearchBreadcrumb: React.FC<SearchBreadcrumbProps> = ({
  subject = '',
  regionLabel,
  regionForPath = 'all',
  className = '',
}) => {
  const parts = subjectBreadcrumbParts(subject);
  const showRegion =
    Boolean(regionLabel?.trim()) &&
    regionLabel !== '全台' &&
    regionLabel !== 'all';

  if (!parts && !showRegion) return null;

  const sep = (
    <span className="text-[#86868b] px-0.5 select-none" aria-hidden>
      &gt;
    </span>
  );

  const parentHref = parts
    ? buildLessonsPath(regionForPath || 'all', parts.parent)
    : buildLessonsPath(regionForPath || 'all', 'all');

  const leafHref =
    parts?.leaf != null
      ? buildLessonsPath(regionForPath || 'all', parts.leaf)
      : null;

  return (
    <nav
      aria-label="麵包屑"
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] sm:text-[14px] text-[#6e6e73] font-medium ${className}`}
    >
      <LogoHomeLink className="text-[#1d1d1f] hover:text-[#FF6363] transition">
        idaltu
      </LogoHomeLink>
      {showRegion && (
        <>
          {sep}
          <Link
            href={buildLessonsPath(regionForPath || 'all', 'all')}
            className="hover:text-[#1d1d1f] transition"
          >
            {regionLabel}
          </Link>
        </>
      )}
      {parts && (
        <>
          {sep}
          <Link href={parentHref} className="hover:text-[#1d1d1f] transition">
            {parts.parent}
          </Link>
          {parts.leaf && leafHref && (
            <>
              {sep}
              <span className="text-[#1d1d1f] font-semibold">{parts.leaf}</span>
            </>
          )}
        </>
      )}
    </nav>
  );
};
