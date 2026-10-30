'use client';

import React, { useState } from 'react';
import { Tutor } from '@/types/tutor';
import {
  X,
  MessageCircle,
  Phone,
  Copy,
  Check,
  BadgeCheck,
} from 'lucide-react';

interface ContactViewModalProps {
  tutor: Tutor | null;
  onClose: () => void;
}

export const ContactViewModal: React.FC<ContactViewModalProps> = ({
  tutor,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!tutor) return null;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="導師聯絡資訊"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <h3 className="text-base font-bold text-slate-900 truncate">導師聯絡資訊</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tutor.avatarUrl} alt={tutor.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">{tutor.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{tutor.headline}</p>
            </div>
          </div>

          <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-2">
            Student Pass 通行中 · 可無限次查看聯絡方式
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 font-medium">LINE ID</p>
                <p className="text-sm font-mono font-bold text-slate-900 truncate select-all">
                  {tutor.contact.lineId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(tutor.contact.lineId, 'line')}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 px-3 py-2 rounded-full transition cursor-pointer flex-shrink-0"
              >
                {copiedField === 'line' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'line' ? '已複製' : '複製 LINE'}
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <Phone className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 font-medium">手機號碼</p>
                <p className="text-sm font-mono font-bold text-slate-900 truncate">
                  {tutor.contact.phone}
                </p>
              </div>
              <a
                href={`tel:${tutor.contact.phone}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-full transition flex-shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                撥打電話
              </a>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
