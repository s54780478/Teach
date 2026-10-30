'use client';

import React from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

export default function PayCancelPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-rise">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <XCircle className="w-7 h-7 text-white/50" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">已取消結帳</h1>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            尚未扣款。您可以隨時再升級 Student Pass，解鎖全台導師聯絡方式。
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/"
              className="inline-flex justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-full transition"
            >
              回首頁
            </Link>
            <Link
              href="/terms"
              className="inline-flex justify-center text-sm font-semibold text-white/60 hover:text-white px-5 py-2.5 rounded-full border border-white/15 transition"
            >
              服務條款
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter variant="dark" />
    </div>
  );
}
