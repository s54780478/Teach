'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  KeyRound,
  Sparkles,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { hasTutorListing } from '@/lib/tutorService';
import { LogoHomeLink } from '@/components/LogoHomeLink';

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

/** Superprof 式頂欄：Logo + 刊登課程 + 登入（Pass 不出現在主 CTA） */
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

  const linkMuted = 'text-[#1d1d1f] hover:opacity-70';

  return (
    <header
      className={`relative z-40 ${
        isHero
          ? 'bg-transparent'
          : 'sticky top-0 bg-white/95 backdrop-blur-md border-b border-black/[0.06]'
      }`}
    >
      {/* 全寬：Logo 永遠貼左、導覽永遠貼右（不隨內容欄置中縮進） */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 w-full">
          <LogoHomeLink className="flex items-center flex-shrink-0 mr-auto">
            <span className="text-[24px] font-black tracking-tight lowercase text-[#FF6363] leading-none">
              idaltu
            </span>
          </LogoHomeLink>

          <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
            {hasStudentPass && (
              <button
                type="button"
                onClick={onOpenContacted}
                className={`relative inline-flex items-center gap-1.5 text-[14px] font-semibold h-10 px-4 rounded-[20px] transition cursor-pointer ${linkMuted} hover:bg-black/[0.04]`}
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

            <Link
              href="/tutor/apply"
              className={`inline-flex items-center text-[14px] font-semibold h-10 px-4 rounded-[20px] transition whitespace-nowrap ${linkMuted} hover:bg-black/[0.04]`}
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
                  className={`inline-flex items-center gap-1 max-w-[160px] text-[14px] font-semibold h-10 px-4 rounded-[20px] transition cursor-pointer ${linkMuted} hover:bg-black/[0.04]`}
                >
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{user.email}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 flex-shrink-0 transition ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1.5 w-52 rounded-2xl border border-black/5 bg-white shadow-lg py-1.5 z-50"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenStudentPass?.();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      {hasStudentPass ? 'Student Pass' : '升級 Student Pass'}
                    </button>
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
                className={`inline-flex items-center text-[14px] font-semibold h-10 px-4 rounded-[20px] transition cursor-pointer ${linkMuted} hover:bg-black/[0.04]`}
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
