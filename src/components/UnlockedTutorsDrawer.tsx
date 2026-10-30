'use client';

import React, { useState } from 'react';
import { Tutor } from '@/types/tutor';
import { X, KeyRound, Phone, MessageCircle, MapPin, Copy, Check } from 'lucide-react';

interface UnlockedTutorsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: Tutor[];
  unlockedIds: string[];
}

export const UnlockedTutorsDrawer: React.FC<UnlockedTutorsDrawerProps> = ({
  isOpen,
  onClose,
  tutors,
  unlockedIds,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const unlockedTutors = unlockedIds
    .map((id) => tutors.find((t) => t.id === id))
    .filter((t): t is Tutor => Boolean(t));

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="已聯繫導師">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] cursor-default border-0"
        aria-label="關閉抽屜"
        onClick={onClose}
      />

      <aside className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">已聯繫導師</h2>
              <p className="text-[11px] text-slate-400">
                共 {unlockedTutors.length} 位・Student Pass 通行期間可隨時回查
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {unlockedTutors.length === 0 ? (
            <div className="text-center py-16 px-6">
              <KeyRound className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">尚無聯繫紀錄</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                開通 Student Pass 後查看導師聯絡方式，紀錄會出現在這裡。
              </p>
            </div>
          ) : (
            unlockedTutors.map((tutor) => (
              <article
                key={tutor.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tutor.avatarUrl}
                      alt={tutor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{tutor.name}</h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded">
                        已聯繫
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {tutor.subjectCategory} · NT${tutor.hourlyRate.toLocaleString()}/hr
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{tutor.location.displayLocation}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <ContactRow
                    icon={<MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    label="LINE"
                    value={tutor.contact.lineId}
                    copied={copiedKey === `${tutor.id}-line`}
                    onCopy={() => handleCopy(tutor.contact.lineId, `${tutor.id}-line`)}
                  />
                  <ContactRow
                    icon={<Phone className="w-3.5 h-3.5 text-slate-600" />}
                    label="電話"
                    value={tutor.contact.phone}
                    href={`tel:${tutor.contact.phone}`}
                    copied={copiedKey === `${tutor.id}-phone`}
                    onCopy={() => handleCopy(tutor.contact.phone, `${tutor.id}-phone`)}
                  />
                </div>
              </article>
            ))
          )}

          {unlockedIds.length > unlockedTutors.length && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl px-3 py-2">
              有 {unlockedIds.length - unlockedTutors.length} 筆聯繫紀錄目前不在列表中（可能已下架）。
            </p>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
          聯繫紀錄保存在本機；需有效 Student Pass 才能查看聯絡方式。學費請直接與導師結算，平台不抽成。
        </footer>
      </aside>
    </div>
  );
};

function ContactRow({
  icon,
  label,
  value,
  href,
  copied,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-semibold text-slate-500 w-8">{label}</span>
      {href ? (
        <a href={href} className="flex-1 font-mono font-bold text-slate-900 truncate hover:text-brand-600">
          {value}
        </a>
      ) : (
        <span className="flex-1 font-mono font-bold text-slate-900 truncate select-all">{value}</span>
      )}
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer flex-shrink-0"
        aria-label={`複製${label}`}
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        {copied ? '已複製' : '複製'}
      </button>
    </div>
  );
}
