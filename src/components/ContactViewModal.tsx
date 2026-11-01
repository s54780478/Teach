'use client';

import React, { useEffect, useState } from 'react';
import { Tutor } from '@/types/tutor';
import { resolveTutorContact } from '@/lib/tutorService';
import {
  X,
  MessageCircle,
  Phone,
  Copy,
  Check,
  BadgeCheck,
  Loader2,
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
  const [contact, setContact] = useState<Tutor['contact'] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tutor) {
      setContact(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void resolveTutorContact(tutor.id)
      .then((c) => {
        if (!cancelled) setContact(c);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tutor]);

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

  const lineId = contact?.lineId || '';
  const phone = contact?.phone || '';

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
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tutor.avatarUrl}
                alt={tutor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1d1d1f] truncate flex items-center gap-1">
                {tutor.name}
                {tutor.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                )}
              </p>
              <p className="text-xs text-[#6e6e73] truncate">{tutor.headline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-[#6e6e73] cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[#6e6e73] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              載入聯絡方式…
            </div>
          ) : !contact || (!lineId && !phone) ? (
            <p className="text-sm text-[#6e6e73] text-center py-6">
              暫時無法取得聯絡方式，請稍後再試。
            </p>
          ) : (
            <>
              {lineId && lineId !== '未提供' && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#f5f5f7]">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageCircle className="w-4 h-4 text-[#06C755] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#6e6e73]">LINE</p>
                      <p className="font-semibold text-[#1d1d1f] truncate">{lineId}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(lineId, 'line')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-semibold cursor-pointer"
                  >
                    {copiedField === 'line' ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    複製
                  </button>
                </div>
              )}

              {phone && phone !== '未提供' && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#f5f5f7]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#6e6e73]">電話</p>
                      <p className="font-semibold text-[#1d1d1f] truncate">{phone}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold"
                  >
                    撥打
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
