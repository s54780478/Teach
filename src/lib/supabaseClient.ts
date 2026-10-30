import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

/** 是否已填入可用的 Supabase 專案設定（未設定時走假資料降級） */
export const isSupabaseConfigured = Boolean(rawUrl && rawKey);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase URL 或 ANON KEY 尚未正確設定於 .env.local — 本機以降級／假資料模式啟動'
  );
}

/**
 * createClient 不接受空字串；未設定時使用佔位值，
 * 讓首頁與開發伺服器可正常編譯／渲染，實際查詢會失敗並由各 service 降級。
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = isSupabaseConfigured ? rawUrl : PLACEHOLDER_URL;
const supabaseAnonKey = isSupabaseConfigured ? rawKey : PLACEHOLDER_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});
