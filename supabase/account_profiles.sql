-- 帳戶中心：擴充 profiles（個人資料）
-- 於 Supabase SQL Editor 執行一次

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists gender text,
  add column if not exists birthday date,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists address_text text,
  add column if not exists notify_sms_requests boolean default true,
  add column if not exists notify_email_activity boolean default true,
  add column if not exists notify_email_requests boolean default true,
  add column if not exists notify_email_received boolean default true,
  add column if not exists notify_email_newsletter boolean default true,
  add column if not exists diploma_url text,
  add column if not exists id_doc_url text,
  add column if not exists updated_at timestamptz default timezone('utc'::text, now());

comment on column public.profiles.avatar_url is '帳戶頭像（Storage 公開 URL）';
