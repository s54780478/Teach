'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import {
  defaultAvatarUrl,
  uploadTutorAvatar,
} from '@/lib/avatarUpload';

interface AvatarPhotoFieldProps {
  userId: string;
  nameForFallback: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/** 選檔上傳本人照片；未上傳則顯示預設頭像 */
export const AvatarPhotoField: React.FC<AvatarPhotoFieldProps> = ({
  userId,
  nameForFallback,
  value,
  onChange,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = value.trim() || defaultAvatarUrl(nameForFallback || 'T');
  const hasCustom = Boolean(value.trim()) && !value.includes('api.dicebear.com');

  const onPick = async (file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    const result = await uploadTutorAvatar(userId, file);
    setUploading(false);
    if (result.error || !result.url) {
      setError(result.error || '上傳失敗');
      return;
    }
    onChange(result.url);
  };

  return (
    <div className="flex items-start gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt="頭像預覽"
        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-xs font-medium text-slate-700">個人照片（選填）</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          建議清晰正面照。未上傳則使用預設頭像。檔案會自動壓縮，不佔用過多空間。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = '';
              void onPick(f);
            }}
          />
          <button
            type="button"
            disabled={disabled || uploading || !userId}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            {uploading ? '上傳中…' : hasCustom ? '更換照片' : '上傳照片'}
          </button>
          {hasCustom && (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => {
                onChange('');
                setError(null);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              移除
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-rose-500" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
