'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { useStudentPass } from '@/hooks/useStudentPass';
import { AuthModal } from '@/components/AuthModal';
import { SITE_SUPPORT_EMAIL } from '@/lib/siteConfig';

interface LegalPageShellProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export const LegalPageShell: React.FC<LegalPageShellProps> = ({
  title,
  updatedAt,
  children,
}) => {
  const { currentUser, studentPass, contactedTutorIds, signOut } = useStudentPass();
  const [authOpen, setAuthOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col">
      <Header
        variant="light"
        user={currentUser}
        hasStudentPass={studentPass.active}
        contactedCount={contactedTutorIds.length}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={() => void signOut()}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          回首頁
        </Link>

        <article className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-xs text-slate-400">最後更新日期：{updatedAt}</p>
          <div className="mt-8 prose-legal space-y-5 text-sm text-slate-600 leading-relaxed">
            {children}
          </div>
          <p className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400">
            如有疑問，請聯繫客服：{' '}
            <a
              href={`mailto:${SITE_SUPPORT_EMAIL}`}
              className="text-brand-500 font-semibold hover:underline"
            >
              {SITE_SUPPORT_EMAIL}
            </a>
          </p>
        </article>
      </main>

      <SiteFooter variant="light" />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
};
