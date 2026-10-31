'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
  AUTH_SOCIAL_METHODS,
  type AuthMethodId,
  type OAuthProviderId,
  isValidEmailFormat,
  sanitizeEmailInput,
  startOAuth,
} from '@/lib/authProviders';
import { showAppToast } from '@/lib/appToast';
import { ProviderBrandIcon } from '@/components/ProviderBrandIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: 'login' | 'signup';
  intentHint?: string | null;
}

type BusyId = AuthMethodId | null;

/** 主路徑：台灣常用 + Superprof 同等（Google／Apple／LINE／Facebook） */
const PRIMARY_SOCIAL = AUTH_SOCIAL_METHODS.filter((m) =>
  ['google', 'apple', 'line', 'facebook'].includes(m.id)
);

/** 次要：開發者／社群 */
const MORE_SOCIAL = AUTH_SOCIAL_METHODS.filter((m) =>
  ['github', 'discord'].includes(m.id)
);

function IdaltuMark({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden>
      <path
        fill="#FF5A5F"
        d="M32 3.2L55.8 16.8v30.4L32 60.8 8.2 47.2V16.8L32 3.2Z"
      />
      <circle cx="32" cy="22" r="3.2" fill="#111111" />
      <rect x="29.2" y="28" width="5.6" height="18" rx="2.4" fill="#111111" />
    </svg>
  );
}

/**
 * Superprof 登入：半透明遮罩可見後方頁面 + 置中深色卡片
 * Email 優先，下方多元社群登入
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'login',
  intentHint: _intentHint = null,
}) => {
  void _intentHint;
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [busyId, setBusyId] = useState<BusyId>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debounceRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      document.body.style.overflow = 'hidden';
    } else {
      setBusyId(null);
      debounceRef.current = false;
      setErrorMsg(null);
      setShowPassword(false);
      setPassword('');
      setShowMore(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, defaultMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyId) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, busyId, onClose]);

  if (!isOpen) return null;

  const anyBusy = busyId !== null;

  const beginBusy = (id: BusyId): boolean => {
    if (debounceRef.current || busyId) return false;
    debounceRef.current = true;
    setBusyId(id);
    setErrorMsg(null);
    return true;
  };

  const endBusy = () => {
    debounceRef.current = false;
    setBusyId(null);
  };

  const handleOAuth = async (methodId: AuthMethodId) => {
    const method = AUTH_SOCIAL_METHODS.find((m) => m.id === methodId);
    if (!method?.provider) return;
    if (!beginBusy(methodId)) return;
    try {
      const result = await startOAuth(method.provider as OAuthProviderId);
      if (result.cancelled) {
        showAppToast('已取消登入', 'info');
        endBusy();
        return;
      }
      if (result.error) {
        setErrorMsg(result.error);
        endBusy();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('cancel') || msg.includes('denied') || msg.includes('popup')) {
        showAppToast('已取消登入', 'info');
      } else {
        setErrorMsg(err instanceof Error ? err.message : '登入失敗，請稍後再試');
      }
      endBusy();
    }
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (anyBusy) return;

    const cleaned = sanitizeEmailInput(email);
    if (!isValidEmailFormat(cleaned)) {
      setErrorMsg('請輸入有效的電子信箱');
      return;
    }

    if (!showPassword) {
      setShowPassword(true);
      setErrorMsg(null);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('密碼至少需 6 位字元');
      return;
    }

    if (!beginBusy('email')) return;

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleaned,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
          endBusy();
          return;
        }
        if (data.session) {
          onSuccess();
          onClose();
          endBusy();
          return;
        }
        setErrorMsg(null);
        showAppToast('驗證信已寄出，請至信箱完成開通', 'success');
        endBusy();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleaned,
        password,
      });

      if (!signInError) {
        onSuccess();
        onClose();
        endBusy();
        return;
      }

      setErrorMsg(
        signInError.message === 'Invalid login credentials'
          ? '電子信箱或密碼錯誤，請重新輸入'
          : signInError.message
      );
      endBusy();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '操作失敗，請稍後再試');
      endBusy();
    }
  };

  const switchMode = (next: 'login' | 'signup') => {
    if (anyBusy) return;
    setMode(next);
    setErrorMsg(null);
    setShowPassword(false);
    setPassword('');
  };

  const socialButtons = (methods: typeof PRIMARY_SOCIAL) =>
    methods.map((method) => {
      const isThisBusy = busyId === method.id;
      const locked = anyBusy && !isThisBusy;

      return (
        <button
          key={method.id}
          type="button"
          disabled={anyBusy}
          aria-label={method.label}
          aria-busy={isThisBusy}
          onClick={() => void handleOAuth(method.id)}
          className={`relative w-full h-[52px] rounded-[14px] bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white text-[15px] font-medium transition disabled:pointer-events-none ${
            locked ? 'opacity-40' : ''
          }`}
        >
          <span className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
            {isThisBusy ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#FF5A5F]" />
            ) : (
              <ProviderBrandIcon id={method.id} className="w-[22px] h-[22px]" />
            )}
          </span>
          <span className="block w-full text-center px-12">{method.label}</span>
        </button>
      );
    });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Superprof 式：半透明遮罩，後方頁面仍可見（非全黑蓋版） */}
      <button
        type="button"
        aria-label="關閉登入視窗"
        disabled={anyBusy}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px] cursor-pointer disabled:cursor-default"
      />

      <div className="relative z-10 w-full sm:max-w-[400px] max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-[24px] sm:rounded-[24px] bg-[#1c1c1e] text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] px-7 pt-2 pb-10">
        <button
          type="button"
          onClick={onClose}
          disabled={anyBusy}
          aria-label="關閉"
          className="-ml-2.5 w-11 h-11 flex items-center justify-center text-[#8e8e93] hover:text-white transition disabled:opacity-40"
        >
          <X className="w-[22px] h-[22px]" strokeWidth={1.6} />
        </button>

        <div className="flex flex-col items-center mt-4 mb-8">
          <IdaltuMark className="w-[56px] h-[56px] mb-5" />
          <h2
            id="auth-modal-title"
            className="text-[32px] sm:text-[34px] font-bold tracking-[-0.03em] text-white leading-none"
          >
            {mode === 'login' ? '登入' : '註冊'}
          </h2>
        </div>

        <form onSubmit={handleEmailContinue} className="flex flex-col gap-3.5">
          <input
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="電子信箱"
            aria-label="電子信箱"
            value={email}
            disabled={anyBusy}
            onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              setEmail(sanitizeEmailInput(e.clipboardData.getData('text')));
            }}
            className="w-full h-[52px] px-5 rounded-[14px] bg-transparent border border-[#3a3a3c] text-[15px] text-white placeholder:text-[#8e8e93] focus:outline-none focus:border-[#6e6e73] transition disabled:opacity-50"
          />

          {showPassword && (
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="密碼"
              aria-label="密碼"
              value={password}
              disabled={anyBusy}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[52px] px-5 rounded-[14px] bg-transparent border border-[#3a3a3c] text-[15px] text-white placeholder:text-[#8e8e93] focus:outline-none focus:border-[#6e6e73] transition disabled:opacity-50"
            />
          )}

          <button
            type="submit"
            disabled={anyBusy}
            className="w-full h-[52px] rounded-[14px] bg-[#E31C3D] hover:bg-[#f02848] active:bg-[#c91834] text-white text-[16px] font-semibold transition flex items-center justify-center gap-2 disabled:opacity-55"
          >
            {busyId === 'email' && <Loader2 className="w-5 h-5 animate-spin" />}
            {mode === 'login' ? '登入' : '註冊'}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-3 text-center text-[13px] text-[#ff6b6b] leading-snug" role="alert">
            {errorMsg}
          </p>
        )}

        <p className="text-center text-[13px] text-[#8e8e93] py-5">或者</p>

        <div className="flex flex-col gap-3" aria-label="其他登入方式">
          {socialButtons(PRIMARY_SOCIAL)}
          {showMore && socialButtons(MORE_SOCIAL)}
        </div>

        {!showMore && (
          <button
            type="button"
            disabled={anyBusy}
            onClick={() => setShowMore(true)}
            className="mt-3 w-full text-center text-[13px] text-[#8e8e93] hover:text-white transition py-2 disabled:opacity-40"
          >
            更多登入方式
          </button>
        )}

        <div className="mt-10 text-center">
          {mode === 'login' ? (
            <>
              <p className="text-[15px] text-[#8e8e93] leading-none mb-3">還沒有帳戶？</p>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => switchMode('signup')}
                className="text-[16px] font-medium text-white leading-none hover:opacity-80 disabled:opacity-40"
              >
                註冊
              </button>
            </>
          ) : (
            <>
              <p className="text-[15px] text-[#8e8e93] leading-none mb-3">已經有帳戶？</p>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => switchMode('login')}
                className="text-[16px] font-medium text-white leading-none hover:opacity-80 disabled:opacity-40"
              >
                登入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
