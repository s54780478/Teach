-- ========================================================
-- idaltu 會員 Profile 與迎新點數自動建立腳本
-- ========================================================

-- 1. 建立 profiles 使用者資料表 (連結 Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  points integer default 100 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 開啟 Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 允許已登入用戶讀取自己的 profile
drop policy if exists "允許使用者讀取自己的 profile" on public.profiles;
create policy "允許使用者讀取自己的 profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 允許已登入用戶更新自己的 profile 點數
drop policy if exists "允許使用者更新自己的 profile" on public.profiles;
create policy "允許使用者更新自己的 profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 允許新增 profile (提供 fallback)
drop policy if exists "允許使用者新增自己的 profile" on public.profiles;
create policy "允許使用者新增自己的 profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. 自動觸發器：當有新用戶在 Supabase 註冊時，自動在 profiles 表建立資料並給予 100 點
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, points)
  values (new.id, new.email, 100)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. 允許 unlocks：只能新增「自己的」解鎖列（禁止 with check (true)）
drop policy if exists "允許已登入用戶新增解鎖紀錄" on public.unlocks;
create policy "允許已登入用戶新增解鎖紀錄"
  on public.unlocks for insert
  to authenticated
  with check (auth.uid()::text = buyer_id);
