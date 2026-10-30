'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
  isApplePrivateRelayEmail,
  parseAuthCallbackError,
} from '@/lib/authProviders';
import { showAppToast } from '@/lib/appToast';

const BIND_EMAIL_KEY = 'idaltu_need_bind_email';

/**
 * OAuth / Magic Link 回調頁
 * - 取消授權 → Toast「已取消登入」後回首頁
 * - Apple 隱藏 Email → 標記需綁定 Email
 * - 同 Email 自動合併依 Supabase Dashboard Automatic Linking
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('正在完成登入…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const { cancelled: userCancelled, message: errMsg } = parseAuthCallbackError(
        window.location.search,
        window.location.hash
      );

      if (userCancelled) {
        showAppToast('已取消登入', 'info');
        router.replace('/');
        return;
      }

      if (errMsg) {
        showAppToast(errMsg, 'error');
        router.replace('/');
        return;
      }

      // PKCE / code exchange（若 URL 含 code）
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          const blob = error.message.toLowerCase();
          if (blob.includes('cancel') || blob.includes('denied')) {
            showAppToast('已取消登入', 'info');
          } else {
            showAppToast(error.message || '登入失敗', 'error');
          }
          router.replace('/');
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.user) {
        // 等 hash token 被 client 解析
        await new Promise((r) => setTimeout(r, 400));
        const again = await supabase.auth.getSession();
        if (!again.data.session?.user) {
          showAppToast('已取消登入', 'info');
          router.replace('/');
          return;
        }
      }

      const user = (await supabase.auth.getUser()).data.user;
      const email = user?.email;
      const provider = user?.app_metadata?.provider as string | undefined;

      if (provider === 'apple' && isApplePrivateRelayEmail(email)) {
        try {
          sessionStorage.setItem(BIND_EMAIL_KEY, '1');
        } catch {
          /* ignore */
        }
        setMessage('請綁定 Email 以合併帳號…');
        showAppToast('Apple 隱藏了 Email，請完成一次性綁定', 'info');
        router.replace('/?bindEmail=1');
        return;
      }

      showAppToast('登入成功', 'success');
      router.replace('/');
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0c0c0e] text-white px-4">
      <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      <p className="text-sm text-white/70">{message}</p>
    </div>
  );
}
