'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useStudentPass } from '@/hooks/useStudentPass';
import {
  accountDisplayName,
  loadAccountProfile,
  saveAccountProfile,
  type AccountProfile,
} from '@/lib/accountProfile';
import { ProfilePhotoCard } from '@/components/account/ProfilePhotoCard';
import { SITE_SUPPORT_EMAIL } from '@/lib/siteConfig';

export default function AccountHomePage() {
  const { currentUser } = useStudentPass();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadAccountProfile(currentUser.id, currentUser.email).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  if (!currentUser) return null;

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6363]" />
      </div>
    );
  }

  const name = accountDisplayName(profile, currentUser.email);

  const onAvatar = async (url: string) => {
    const next = { ...profile, avatarUrl: url };
    setProfile(next);
    await saveAccountProfile(currentUser.id, next);
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-4 sm:gap-5">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5">
          <ProfilePhotoCard
            userId={currentUser.id}
            name={name}
            avatarUrl={profile.avatarUrl}
            onChange={(url) => void onAvatar(url)}
            title=""
            large
          />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-center">{name}</h1>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <p className="text-sm text-white/70">個人資料已確認</p>
            <span className="w-6 h-6 rounded-full bg-[#FF6363]/10 text-[#FF6363] text-xs font-bold flex items-center justify-center">
              ✓
            </span>
          </div>
        </div>

        <a
          href={`mailto:${SITE_SUPPORT_EMAIL}`}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1c1c1e] px-5 py-4 text-sm text-white/85 hover:bg-[#242426] transition"
        >
          <MessageCircle className="w-5 h-5 text-[#5ac8fa]" />
          聯絡我們
        </a>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5 sm:p-6 min-h-[220px] flex flex-col">
        <h2 className="text-base font-semibold mb-4">我的訊息</h2>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[#5ac8fa] font-semibold text-lg">沒有請求</p>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              開通 Student Pass 並聯繫導師後，往來紀錄會出現在這裡。
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#FF6363] hover:bg-[#ff5252] text-white text-sm font-semibold whitespace-nowrap transition"
          >
            找到適合你的老師
          </Link>
        </div>
      </div>
    </div>
  );
}
