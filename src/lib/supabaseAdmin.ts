import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 伺服端專用（Webhook / Checkout）；勿匯入至 Client Component */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY 或 URL 未設定，無法以 admin 寫入 subscriptions');
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
