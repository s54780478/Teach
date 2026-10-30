import type { Provider } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export type AuthMethodId =
  | 'google'
  | 'line'
  | 'apple'
  | 'email'
  | 'facebook'
  | 'github'
  | 'discord';

/** 官方 Provider 聯合型別尚未含 line；Dashboard 已支援，呼叫時轉成 Provider */
export type OAuthProviderId = Provider | 'line';

export interface AuthMethod {
  id: AuthMethodId;
  label: string;
  /** Supabase OAuth provider；email 為 null */
  provider: OAuthProviderId | null;
}

/** Email 為表單主路徑；以下為「或者」區塊社群登入（圖示置左） */
export const AUTH_SOCIAL_METHODS: AuthMethod[] = [
  { id: 'google', label: '使用 Google 登入', provider: 'google' },
  { id: 'apple', label: '使用 Apple 登入', provider: 'apple' },
  { id: 'line', label: '使用 LINE 登入', provider: 'line' },
  { id: 'facebook', label: '使用 Facebook 登入', provider: 'facebook' },
  { id: 'github', label: '使用 GitHub 登入', provider: 'github' },
  { id: 'discord', label: '使用 Discord 登入', provider: 'discord' },
];

/** @deprecated 改用 AUTH_SOCIAL_METHODS + Email 表單 */
export const AUTH_METHODS: AuthMethod[] = [
  { id: 'email', label: '使用 Email 登入', provider: null },
  ...AUTH_SOCIAL_METHODS,
];

export const APPLE_PRIVATE_RELAY_SUFFIX = '@privaterelay.appleid.com';

export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return email.toLowerCase().endsWith(APPLE_PRIVATE_RELAY_SUFFIX) || !email.includes('@');
}

/** Email 輸入：僅保留合法字元並轉小寫 */
export function sanitizeEmailInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9@._+\-]/g, '').toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getOAuthRedirectTo(): string {
  if (typeof window === 'undefined') return '/auth/callback';
  return `${window.location.origin}/auth/callback`;
}

export async function startOAuth(
  provider: OAuthProviderId
): Promise<{ error?: string; cancelled?: boolean }> {
  const options: {
    redirectTo: string;
    skipBrowserRedirect: boolean;
    queryParams?: Record<string, string>;
  } = {
    redirectTo: getOAuthRedirectTo(),
    skipBrowserRedirect: false,
  };

  // Google 專用；其他 provider 勿帶 access_type / prompt
  if (provider === 'google') {
    options.queryParams = {
      access_type: 'offline',
      prompt: 'select_account',
    };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    // LINE 於 Dashboard 可用；SDK 型別尚未列入，故安全斷言
    provider: provider as Provider,
    options,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('cancel') ||
      msg.includes('access_denied') ||
      msg.includes('popup') ||
      msg.includes('user denied')
    ) {
      return { cancelled: true };
    }
    return { error: error.message };
  }

  // 瀏覽器導向 OAuth；若無 url 則視為失敗
  if (!data?.url) {
    return { error: '無法開啟登入頁，請稍後再試' };
  }
  return {};
}

export function parseAuthCallbackError(search: string, hash: string): {
  cancelled: boolean;
  message: string | null;
} {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const error =
    params.get('error') ||
    params.get('error_code') ||
    hashParams.get('error') ||
    hashParams.get('error_code');
  const desc =
    params.get('error_description') ||
    hashParams.get('error_description') ||
    '';

  if (!error) return { cancelled: false, message: null };

  const blob = `${error} ${desc}`.toLowerCase();
  if (
    blob.includes('access_denied') ||
    blob.includes('cancelled') ||
    blob.includes('canceled') ||
    blob.includes('user_cancelled') ||
    blob.includes('consent')
  ) {
    return { cancelled: true, message: '已取消登入' };
  }
  return { cancelled: false, message: desc || error };
}
