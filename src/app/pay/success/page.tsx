'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { fetchStudentPassState } from '@/lib/subscriptionService';
import { supabase } from '@/lib/supabaseClient';
import { formatPassExpiry } from '@/lib/studentPassStorage';
import { SiteFooter } from '@/components/SiteFooter';

function PaySuccessContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') || '';
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'ok' | 'pending'>('loading');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        // 藍新定期定額／刷卡成功導回後，向 Supabase 拉最新訂閱
        // （背景 Notify 可能略晚於 ReturnURL）
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          // 短暫重試：等待 Notify 寫入
          let pass = await fetchStudentPassState(userId);
          if (!pass.active) {
            await new Promise((r) => setTimeout(r, 1200));
            pass = await fetchStudentPassState(userId);
          }
          if (!cancelled) {
            setExpiresAt(pass.expiresAt);
            setStatus(pass.active ? 'ok' : 'pending');
          }
          return;
        }
        if (!cancelled) setStatus('pending');
      } catch {
        if (!cancelled) setStatus('pending');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, sessionId]);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {status === 'loading' ? (
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        ) : (
          <div className="max-w-md w-full text-center animate-fade-rise">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {status === 'ok' ? 'Student Pass 已開通' : '付款處理中'}
            </h1>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              {status === 'ok'
                ? `有效至 ${formatPassExpiry(expiresAt)}。現在可直接查看全台導師聯絡方式。`
                : '若剛完成付款，系統可能稍晚更新。請重新整理首頁或稍候再試。'}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/#tutors"
                className="inline-flex justify-center bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-full transition"
              >
                開始聯繫導師
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center text-sm font-semibold text-white/70 hover:text-white px-5 py-2.5 rounded-full border border-white/15 transition"
              >
                回首頁
              </Link>
            </div>
          </div>
        )}
      </div>
      <SiteFooter variant="dark" />
    </div>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <PaySuccessContent />
    </Suspense>
  );
}
