'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Sparkles, AlertCircle, CheckCircle2, Lock, Mail, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          // 若 Supabase 未開啟信箱驗證，直接登入成功
          setSuccessMsg('註冊成功！已自動為您登入並存入 100 點迎新點數。');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 900);
        } else {
          // 若 Supabase 有開啟確認信箱
          setSuccessMsg('註冊驗證信已寄出！請至信箱點擊確認連結以完成開通。');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' ? '電子信箱或密碼錯誤，請重新輸入' : error.message);
          return;
        }

        setSuccessMsg('登入成功！正在載入您的學員點數...');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || '操作失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">idaltu</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            <span className="text-xs text-gray-400 font-medium ml-1">
              {mode === 'login' ? '學員登入' : '免費註冊'}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="關閉"
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-1.5 rounded-lg transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            登入帳號
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`py-1.5 rounded-lg transition ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            免費註冊
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3.5">
          
          {/* Welcome Bonus Notice for Sign Up */}
          {mode === 'signup' && (
            <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-800 leading-normal">
              <Sparkles className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>迎新好禮：</strong>新學員註冊即贈送 <strong>100 點解鎖點數</strong>，可直接解鎖多位導師！
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">電子信箱</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-gray-400 transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">密碼（至少 6 位字元）</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-gray-400 transition"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span>處理中...</span>
            ) : mode === 'login' ? (
              <>
                <span>登入帳號</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>立即註冊並領取 100 點</span>
                <Sparkles className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Footer Mode Switch Prompt */}
          <div className="text-center text-xs text-gray-500 pt-1">
            {mode === 'login' ? (
              <span>
                還沒有帳號？{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  免費註冊領取 100 點
                </button>
              </span>
            ) : (
              <span>
                已經有帳號？{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  返回登入
                </button>
              </span>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
