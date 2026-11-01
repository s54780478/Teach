'use client';

import React from 'react';
import { youtubeEmbedSrc } from '@/lib/youtubeUrl';

interface TutorYoutubeEmbedProps {
  youtubeUrl?: string | null;
  title?: string;
}

/** 履歷頁 16:9 嵌入播放器；無有效網址則不渲染 */
export function TutorYoutubeEmbed({
  youtubeUrl,
  title = '導師自我介紹影片',
}: TutorYoutubeEmbedProps) {
  const src = youtubeEmbedSrc(youtubeUrl);
  if (!src) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[#1a1a1a]">自我介紹影片</h3>
      <div className="relative w-full overflow-hidden rounded-2xl border border-black/[0.08] bg-black aspect-video shadow-sm">
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
      <p className="text-[11px] text-[#86868b]">
        影片僅供認識教學風格；聯絡方式須透過 Student Pass 解鎖，請勿於影片私下聯繫。
      </p>
    </div>
  );
}
