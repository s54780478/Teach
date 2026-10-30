'use client';

import React, { useState } from 'react';
import { Loader2, Mail, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { isValidEmailFormat, sanitizeEmailInput } from '@/lib/authProviders';
import { showAppToast } from '@/lib/appToast';

interface BindEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBound: () => void;
}

/**
 * Apple「隱藏 Email」一次性引導：驗證並綁定真實 Email，作為帳號合併主鍵。
 */
export const BindEmailModal: React.FC<BindEmailModalProps> = ({
  isOpen,
  onClose,
  onBound,
}) => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const cleaned = sanitizeEmailInput(email);
    if (!isValidEmailFormat(cleaned)) {
      setError('請輸入有效的電子信箱');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ email: cleaned });
      if (updateError) {
        setError(updateError.message);
        setBusy(false);
        return;
      }
      try {
        sessionStorage.removeItem('idaltu_need_bind_email');
      } catch {
        /* ignore */
      }
      showAppToast('驗證信已寄出，請至信箱完成綁定', 'success');
      onBound();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '綁定失敗，請稍後再試');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bind-email-title"
    >
      <div className="w-full max-w-[360px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 id="bind-email-title" className="text-sm font-bold text-slate-900">
            綁定 Email（一次性）
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="關閉"
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            您使用 Apple 登入並選擇了隱藏 Email。為避免重複帳號，請驗證真實信箱作為帳號主鍵；之後以 Google／LINE
            等同信箱登入會自動合併。
          </p>

          <div>
            <label htmlFor="bind-email" className="block text-xs font-medium text-gray-700 mb-1">
              電子信箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                id="bind-email"
                type="email"
                required
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                onPaste={(e) => {
                  e.preventDefault();
                  setEmail(sanitizeEmailInput(e.clipboardData.getData('text')));
                }}
                placeholder="you@example.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-gray-400 disabled:opacity-60"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[44px] py-2.5 bg-brand-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            寄送驗證並綁定
          </button>
        </form>
      </div>
    </div>
  );
};
