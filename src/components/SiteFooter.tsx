'use client';

import React from 'react';
import Link from 'next/link';
import { LogoHomeLink } from '@/components/LogoHomeLink';
import { SITE_NAME, SITE_SUPPORT_EMAIL } from '@/lib/siteConfig';

interface SiteFooterProps {
  variant?: 'dark' | 'light';
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ variant = 'dark' }) => {
  const isDark = variant === 'dark';

  return (
    <footer
      className={`border-t ${
        isDark
          ? 'bg-[#0a0a0b] border-white/5 text-white/70'
          : 'bg-white border-black/[0.06] text-[#6e6e73]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="max-w-sm">
            <LogoHomeLink
              className={`font-black text-sm tracking-tight inline-block ${
                isDark ? 'text-brand-500' : 'text-brand-500'
              }`}
            >
              {SITE_NAME}
            </LogoHomeLink>
            <p className="mt-2 text-xs leading-relaxed">
              台灣在地家教與多元技能媒合平台。導師免費刊登、學員訂閱 Student Pass
              後解鎖聯繫；平台不抽成鐘點費。
            </p>
            <p className="mt-3 text-xs">
              客服信箱：{' '}
              <a
                href={`mailto:${SITE_SUPPORT_EMAIL}`}
                className={
                  isDark
                    ? 'text-white/70 hover:text-white underline underline-offset-2'
                    : 'text-slate-700 hover:text-slate-900 underline underline-offset-2'
                }
              >
                {SITE_SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 text-xs">
            <div className="space-y-2 min-w-[7rem]">
              <p className={`font-semibold ${isDark ? 'text-white/70' : 'text-slate-800'}`}>
                探索
              </p>
              <Link href="/#tutors" className="block hover:opacity-100 opacity-80 transition">
                尋找導師
              </Link>
              <Link href="/tutor/apply" className="block hover:opacity-100 opacity-80 transition">
                刊登課程
              </Link>
              <Link
                href="/tutor/dashboard"
                className="block hover:opacity-100 opacity-80 transition"
              >
                導師後台
              </Link>
            </div>
            <div className="space-y-2 min-w-[7rem]">
              <p className={`font-semibold ${isDark ? 'text-white/70' : 'text-slate-800'}`}>
                法律資訊
              </p>
              <Link href="/terms" className="block hover:opacity-100 opacity-80 transition">
                服務條款
              </Link>
              <Link href="/privacy" className="block hover:opacity-100 opacity-80 transition">
                隱私權政策
              </Link>
            </div>
            <div className="space-y-2 min-w-[7rem]">
              <p className={`font-semibold ${isDark ? 'text-white/70' : 'text-slate-800'}`}>
                支援
              </p>
              <a
                href={`mailto:${SITE_SUPPORT_EMAIL}`}
                className="block hover:opacity-100 opacity-80 transition"
              >
                聯絡客服
              </a>
              <span className="block opacity-70">Student Pass 說明</span>
            </div>
          </div>
        </div>

        <div
          className={`mt-8 pt-5 border-t text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            isDark ? 'border-white/5' : 'border-slate-100'
          }`}
        >
          <p>© {new Date().getFullYear()} {SITE_NAME} · 在地家教課程媒合</p>
          <p className="opacity-80">付款服務由藍新金流（NewebPay）提供</p>
        </div>
      </div>
    </footer>
  );
};
