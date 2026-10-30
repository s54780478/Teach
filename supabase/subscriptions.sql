-- ========================================================
-- Student Pass 訂閱表（ECPay / Stripe / Demo）
-- 請在 Supabase SQL Editor 執行
-- ========================================================

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'inactive'
    check (status in ('active', 'inactive', 'canceled', 'past_due', 'pending')),
  plan text not null default 'student_pass_monthly',
  provider text default 'demo'
    check (provider is null or provider in ('newebpay', 'demo', 'ecpay', 'stripe')),
  provider_ref text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id)
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_period_end_idx on public.subscriptions (current_period_end);

alter table public.subscriptions enable row level security;

-- 使用者只能讀自己的訂閱
drop policy if exists "允許使用者讀取自己的訂閱" on public.subscriptions;
create policy "允許使用者讀取自己的訂閱"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- 前端 Demo fallback：允許已登入者 upsert 自己的列（正式金流由 service role 寫入）
drop policy if exists "允許使用者新增自己的訂閱" on public.subscriptions;
create policy "允許使用者新增自己的訂閱"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "允許使用者更新自己的訂閱" on public.subscriptions;
create policy "允許使用者更新自己的訂閱"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.subscriptions is 'Student Pass 訂閱狀態；金流 callback 以 service role 更新';
