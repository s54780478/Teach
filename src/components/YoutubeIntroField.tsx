'use client';

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  YOUTUBE_POLICY_NOTICE,
  validateOptionalYoutubeUrl,
  youtubeEmbedSrc,
} from '@/lib/youtubeUrl';

interface YoutubeIntroFieldProps {
  value: string;
  onChange: (next: string) => void;
  /** 明確移除已存影片（會清 DB） */
  onClear?: () => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}

/** 刊登／編輯：YouTube 自我介紹影片（選填）+ 平台規範提醒 */
export function YoutubeIntroField({
  value,
  onChange,
  onClear,
  error,
  disabled,
  id = 'youtube-url',
}: YoutubeIntroFieldProps) {
  const localError = useMemo(() => {
    if (!value.trim()) return null;
    const v = validateOptionalYoutubeUrl(value);
    return v.ok ? null : v.message;
  }, [value]);

  const previewSrc = useMemo(() => {
    if (!value.trim() || localError) return null;
    return youtubeEmbedSrc(value);
  }, [value, localError]);

  const showError = error || localError;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          自我介紹影片（選填）
          <span className="text-slate-400 font-normal ml-1">
            僅 YouTube／Shorts・請貼在此欄
          </span>
        </label>
        {value.trim() && onClear && (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="text-[11px] text-slate-500 hover:text-rose-600 underline-offset-2 hover:underline disabled:opacity-50"
          >
            移除影片
          </button>
        )}
      </div>
      <input
        id={id}
        type="text"
        inputMode="url"
        autoComplete="off"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=… 或 https://youtu.be/…"
        aria-invalid={Boolean(showError)}
        aria-describedby={`${id}-policy ${showError ? `${id}-error` : ''}`.trim()}
        className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 disabled:opacity-60 ${
          showError ? 'border-rose-300' : 'border-slate-200'
        }`}
      />
      {showError && (
        <p id={`${id}-error`} className="text-xs text-rose-500">
          {showError}
        </p>
      )}
      {previewSrc && (
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-black aspect-video">
          <iframe
            src={previewSrc}
            title="自我介紹影片預覽"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        儲存後會自動記住此網址；下次編輯會帶回來，不必重找連結。
      </p>
      <div
        id={`${id}-policy`}
        role="note"
        className="rounded-xl border border-amber-300/80 bg-amber-50 px-3.5 py-3 text-[12px] text-amber-950 leading-relaxed"
      >
        <p className="font-bold inline-flex items-start gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
          平台規範提醒
        </p>
        <p>{YOUTUBE_POLICY_NOTICE}</p>
      </div>
    </div>
  );
}
