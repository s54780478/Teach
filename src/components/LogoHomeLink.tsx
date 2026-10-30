'use client';

import React, { type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** 首頁監聽此事件以清空搜尋／篩選 */
export const HOME_RESET_EVENT = 'idaltu:go-home';

export function dispatchHomeReset(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT));
}

interface LogoHomeLinkProps {
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/**
 * 全站 Logo／品牌連回首頁。
 * 子路由（如 /lessons/...）用硬導向，避免 soft nav 卡在編碼路徑；
 * 已在首頁則清空篩選並捲到頂。
 */
export const LogoHomeLink: React.FC<LogoHomeLinkProps> = ({
  className,
  children,
  'aria-label': ariaLabel = 'idaltu 首頁',
}) => {
  const pathname = usePathname();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    dispatchHomeReset();

    if (pathname === '/' || pathname === '') {
      window.history.replaceState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.location.assign('/');
  };

  return (
    <Link href="/" className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  );
};
