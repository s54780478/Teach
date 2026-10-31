'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { uploadTutorAvatar } from '@/lib/avatarUpload';
import { accountAvatarSrc } from '@/lib/accountProfile';

interface ProfilePhotoCardProps {
  userId: string;
  name: string;
  avatarUrl: string;
  onChange: (url: string) => void;
  title?: string;
  large?: boolean;
}

/** Superprof 式大頭貼＋紅色相機鈕 */
export const ProfilePhotoCard: React.FC<ProfilePhotoCardProps> = ({
  userId,
  name,
  avatarUrl,
  onChange,
  title = '個人資料圖片',
  large = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = accountAvatarSrc(avatarUrl, name);
  const hasCustom = Boolean(avatarUrl.trim()) && !avatarUrl.includes('dicebear');

  const pick = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await uploadTutorAvatar(userId, file);
    setBusy(false);
    if (result.error || !result.url) {
      setError(result.error || '上傳失敗');
      return;
    }
    onChange(result.url);
  };

  return (
    <div
      className={
        title
          ? 'rounded-2xl border border-white/10 bg-[#1c1c1e] p-5 h-full'
          : 'h-full'
      }
    >
      {title ? <h3 className="text-sm font-semibold text-white mb-4">{title}</h3> : null}
      <div className={`relative mx-auto ${large ? 'w-full max-w-[280px]' : 'w-40'}`}>
        <div
          className={`relative overflow-hidden rounded-2xl bg-[#2c2c2e] border border-white/10 ${
            large ? 'aspect-square' : 'w-40 h-40'
          }`}
        >
          {hasCustom ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/25">
              <User className="w-16 h-16" strokeWidth={1.25} />
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          aria-label="上傳照片"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#FF6363] hover:bg-[#ff5252] text-white flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = '';
            void pick(f);
          }}
        />
      </div>
      {error && (
        <p className="mt-3 text-xs text-[#ff6b6b] text-center" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-[11px] text-white/40 text-center leading-relaxed">
        自動壓縮後上傳。未上傳則顯示預設頭像。
      </p>
    </div>
  );
};
