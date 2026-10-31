'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { StudentPassModal } from '@/components/StudentPassModal';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { Loader2 } from 'lucide-react';

const TOP_TABS = [
  { href: '/account', label: '用戶中心', match: (p: string) => p === '/account' },
  {
    href: '/account/messages',
    label: '我的訊息',
    match: (p: string) => p.startsWith('/account/messages'),
  },
  {
    href: '/account/profile',
    label: '我的帳戶',
    match: (p: string) =>
      p.startsWith('/account/profile') ||
      p.startsWith('/account/billing') ||
      p.startsWith('/account/payments'),
  },
] as const;

const ACCOUNT_SUB = [
  { href: '/account/profile', label: '個人資料' },
  { href: '/account/billing', label: '我的帳單' },
  { href: '/account/payments', label: '付款明細' },
] as const;

interface AccountShellProps {
  children: React.ReactNode;
}

export const AccountShell: React.FC<AccountShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    studentPass,
    contactedTutorIds,
    authReady,
    signOut,
    subscribe,
    cancelPass,
  } = useStudentPass();
  const [authOpen, setAuthOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  const showSubNav = ACCOUNT_SUB.some((t) => pathname.startsWith(t.href));

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) setAuthOpen(true);
  }, [authReady, currentUser]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#FF6363]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      <div className="bg-white text-[#1d1d1f]">
        <Header
          variant="light"
          user={currentUser}
          hasStudentPass={studentPass.active}
          contactedCount={contactedTutorIds.length}
          onOpenStudentPass={() => setPassOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          onSignOut={() => void signOut()}
        />
      </div>

      <div className="border-b border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-6 sm:gap-8 overflow-x-auto" aria-label="帳戶主選單">
            {TOP_TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative py-4 text-[15px] whitespace-nowrap transition ${
                    active ? 'text-white font-semibold' : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-white/80 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {showSubNav && (
        <div className="border-b border-white/[0.06]">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto" aria-label="帳戶子選單">
              {ACCOUNT_SUB.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`py-3 text-[13px] sm:text-[14px] whitespace-nowrap transition ${
                      active ? 'text-white font-semibold' : 'text-white/45 hover:text-white/75'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentUser ? (
          children
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-8 text-center">
            <p className="text-white/70 text-sm mb-4">請先登入以使用帳戶中心</p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex h-11 px-6 rounded-full bg-[#FF6363] text-white text-sm font-semibold cursor-pointer"
            >
              登入
            </button>
          </div>
        )}
      </main>

      <SiteFooter variant="dark" />

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          if (!currentUser) router.push('/');
        }}
        onSuccess={() => setAuthOpen(false)}
      />

      <StudentPassModal
        isOpen={passOpen}
        pass={studentPass}
        onClose={() => setPassOpen(false)}
        onSubscribe={async (card) => {
          await subscribe(card);
          setPassOpen(false);
        }}
        onCancelPass={() => void cancelPass()}
      />
    </div>
  );
};
