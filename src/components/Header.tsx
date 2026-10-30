'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User, LogOut, KeyRound, HelpCircle, Sparkles, LayoutDashboard, ChevronDown } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { hasTutorListing } from '@/lib/tutorService';

interface HeaderProps {
  variant?: 'hero' | 'light';
  user?: SupabaseUser | null;
  hasStudentPass?: boolean;
  contactedCount?: number;
  onOpenStudentPass?: () => void;
  onOpenContacted?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  variant = 'hero',
  user = null,
  hasStudentPass = false,
  contactedCount = 0,
  onOpenStudentPass,
  onOpenContacted,
  onOpenAuth,
  onSignOut,
}) => {
  const isHero = variant === 'hero';
  const [isTutor, setIsTutor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setIsTutor(false);
      return;
    }
    void hasTutorListing(user.id).then((ok) => {
      if (!cancelled) setIsTutor(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className={`relative z-40 ${
        isHero
          ? 'bg-transparent'
          : 'sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem]">
          <Link href="/" className="flex items-center gap-0.5 flex-shrink-0" aria-label="idaltu 首頁">
            <span
              className={`text-[1.65rem] sm:text-2xl font-black tracking-tight lowercase ${
                isHero ? 'text-brand-500' : 'text-slate-900'
              }`}
            >
              idaltu
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
            {hasStudentPass && (
              <button
                type="button"
                onClick={onOpenContacted}
                className={`relative inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  isHero
                    ? 'text-white/85 hover:text-white hover:bg-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="已聯繫導師"
              >
                <KeyRound className="w-4 h-4" />
                <span className="hidden sm:inline">已聯繫</span>
                {contactedCount > 0 && (
                  <span className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {contactedCount > 99 ? '99+' : contactedCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenStudentPass}
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                hasStudentPass
                  ? isHero
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/25'
              }`}
              aria-label={hasStudentPass ? '查看 Student Pass' : '升級 Student Pass'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">
                {hasStudentPass ? 'Student Pass' : '升級 Student Pass'}
              </span>
              <span className="sm:hidden">{hasStudentPass ? 'Pass' : '訂閱'}</span>
            </button>

            <a
              href="#tutors"
              className={`hidden md:inline-flex p-2 rounded-lg transition ${
                isHero ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700'
              }`}
              aria-label="探索課程"
            >
              <HelpCircle className="w-4 h-4" />
            </a>

            <Link
              href="/tutor/apply"
              className={`text-sm font-semibold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                isHero
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              刊登課程
            </Link>

            {user ? (
              <div className="relative pl-0.5" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="帳號選單"
                  className={`inline-flex items-center gap-1 max-w-[160px] text-xs sm:text-sm font-medium px-2 py-1.5 rounded-lg transition cursor-pointer ${
                    isHero
                      ? 'text-white/85 hover:text-white hover:bg-white/10'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{user.email}</span>
                  <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 py-1.5 z-50"
                  >
                    {isTutor && (
                      <Link
                        href="/tutor/dashboard"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-500" />
                        我的課程管理
                      </Link>
                    )}
                    <Link
                      href="/tutor/edit"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      編輯履歷／課程
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className={`text-sm font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  isHero
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                登入
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
