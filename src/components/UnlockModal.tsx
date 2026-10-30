'use client';

import React, { useEffect, useState } from 'react';
import { Tutor } from '@/types/tutor';
import {
  X,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Phone,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const UNLOCK_COST_POINTS = 50;
const UNLOCK_PRICE_LABEL = 'NT$ 50';

export type UnlockModalPhase = 'confirm' | 'success' | 'view';

interface UnlockModalProps {
  tutor: Tutor | null;
  userPoints: number;
  isAlreadyUnlocked?: boolean;
  onConfirm: (tutorId: string) => Promise<boolean>;
  onClose: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  tutor,
  userPoints,
  isAlreadyUnlocked = false,
  onConfirm,
  onClose,
}) => {
  const [phase, setPhase] = useState<UnlockModalPhase>(
    isAlreadyUnlocked ? 'view' : 'confirm'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!tutor) return;
    setPhase(isAlreadyUnlocked ? 'view' : 'confirm');
    setErrorMsg(null);
    setIsSubmitting(false);
    setCopiedField(null);
  }, [tutor?.id, isAlreadyUnlocked]);

  if (!tutor) return null;

  const remainingAfter = userPoints - UNLOCK_COST_POINTS;
  const hasEnoughPoints = userPoints >= UNLOCK_COST_POINTS;
  const showContacts = phase === 'success' || phase === 'view';

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const handleConfirm = async () => {
    if (!hasEnoughPoints || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await onConfirm(tutor.id);
      if (ok) {
        setPhase('success');
      } else {
        setErrorMsg('解鎖失敗，請稍後再試');
      }
    } catch {
      setErrorMsg('解鎖失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                showContacts
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-brand-500'
              }`}
            >
              {showContacts ? (
                <CheckCircle2 className="w-4.5 h-4.5 w-4 h-4" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
            </div>
            <h3 id="unlock-modal-title" className="text-base font-bold text-slate-900 truncate">
              {phase === 'confirm' && '確認解鎖聯絡方式'}
              {phase === 'success' && '解鎖成功'}
              {phase === 'view' && '導師聯絡資訊'}
            </h3>
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
          {/* 導師摘要 */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tutor.avatarUrl}
                alt={tutor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 truncate">{tutor.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                {tutor.headline || tutor.subjectCategory}
              </p>
              <p className="text-[11px] font-semibold text-slate-700 mt-1">
                NT$ {tutor.hourlyRate.toLocaleString()}/小時
              </p>
            </div>
          </div>

          {phase === 'confirm' && (
            <>
              <p className="text-sm text-slate-700 leading-relaxed">
                確定要解鎖該導師的聯絡方式嗎？
                <span className="font-semibold text-slate-900">
                  （消耗 1 次解鎖額度 / {UNLOCK_PRICE_LABEL}）
                </span>
              </p>

              <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-sm">
                <li className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">LINE ID</p>
                    <p className="text-xs text-slate-500">解鎖後可一鍵複製並加好友</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <Phone className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">手機號碼</p>
                    <p className="text-xs text-slate-500">可直接撥打與導師聯繫排課</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 px-3.5 py-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">專屬聯絡注意事項</p>
                    <p className="text-xs text-slate-500">
                      鐘點費直接與導師結算，平台不抽成；請禮貌聯繫並約定試聽時間
                    </p>
                  </div>
                </li>
              </ul>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>本次消耗</span>
                  <span className="font-bold text-brand-500">
                    1 次額度 · {UNLOCK_COST_POINTS} 點（{UNLOCK_PRICE_LABEL}）
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>目前剩餘點數</span>
                  <span className="font-medium text-slate-900">{userPoints} 點</span>
                </div>
                <div className="flex justify-between font-bold pt-1.5 border-t border-slate-200">
                  <span className="text-slate-900">解鎖後剩餘</span>
                  <span className={remainingAfter >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                    {remainingAfter} 點
                  </span>
                </div>
              </div>

              {!hasEnoughPoints && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>點數不足，請先加值後再解鎖。</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}

          {showContacts && (
            <>
              {phase === 'success' && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/70 px-3.5 py-2.5 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">已成功解鎖，可立即聯繫導師</span>
                </div>
              )}

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
                    {copiedField === 'line' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
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

              <p className="text-[11px] text-slate-400 leading-relaxed">
                專屬注意：請在合理時段聯繫；學費直接與導師結算，idaltu 不抽成仲介費。
              </p>
            </>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {phase === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition cursor-pointer disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!hasEnoughPoints || isSubmitting}
                onClick={() => void handleConfirm()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? '解鎖中…' : '確認解鎖'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition cursor-pointer"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { UNLOCK_COST_POINTS };
