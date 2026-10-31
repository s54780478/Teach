-- ========================================================
-- idaltu 資料庫架構與初始化腳本 (Supabase SQL Editor 專用)
-- ========================================================

-- 1. 建立導師資料表 (tutors)
create table if not exists public.tutors (
  id text primary key,
  name text not null,
  headline text,
  bio text,
  avatar_url text,
  degree text,
  specialty_tags text[] default '{}',
  subject_category text,
  city text,
  district text,
  display_location text,
  mode text default 'hybrid', -- 'in-person', 'online', 'hybrid'（由 teaching_modes 推導）
  teaching_modes text[] default array['online','in_person','student_home']::text[],
  hourly_rate integer not null default 800,
  first_lesson_free boolean default true, -- Superprof free_first_lesson
  free_lesson_minutes integer default 60,
  response_time text default '通常在 1 小時內回覆',
  response_speed_minutes integer default 60,
  is_verified boolean default false,
  is_identity_verified boolean default false,
  is_diploma_verified boolean default false,
  taught_hours integer default 100,
  rating numeric(3, 1) default 5.0,
  review_count integer default 0,
  badge text,
  line_id text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 建立買方解鎖紀錄資料表 (unlocks)
create table if not exists public.unlocks (
  id uuid default gen_random_uuid() primary key,
  tutor_id text references public.tutors(id) on delete cascade not null,
  buyer_id text default 'student-guest',
  points_spent integer default 30 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 設定 Row Level Security (RLS) 安全存取權限
alter table public.tutors enable row level security;
alter table public.unlocks enable row level security;

-- 允許所有人公開讀取導師列表
drop policy if exists "允許所有人公開讀取導師列表" on public.tutors;
create policy "允許所有人公開讀取導師列表" 
  on public.tutors for select 
  using (true);

-- 寫入僅限本人（auth.uid 必須等於 tutors.id）
drop policy if exists "允許已登入用戶新增自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶更新自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶刪除自己的履歷" on public.tutors;
drop policy if exists "允許公開新增導師履歷" on public.tutors;
drop policy if exists "允許公開更新導師履歷" on public.tutors;

create policy "允許已登入用戶新增自己的履歷"
  on public.tutors for insert
  to authenticated
  with check (auth.uid()::text = id);

create policy "允許已登入用戶更新自己的履歷"
  on public.tutors for update
  to authenticated
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create policy "允許已登入用戶刪除自己的履歷"
  on public.tutors for delete
  to authenticated
  using (auth.uid()::text = id);

-- unlocks：僅本人可讀寫
drop policy if exists "允許所有人讀取解鎖紀錄" on public.unlocks;
drop policy if exists "允許所有人新增解鎖紀錄" on public.unlocks;
drop policy if exists "允許已登入用戶讀取自己的解鎖" on public.unlocks;
drop policy if exists "允許已登入用戶新增解鎖紀錄" on public.unlocks;

create policy "允許已登入用戶讀取自己的解鎖"
  on public.unlocks for select
  to authenticated
  using (auth.uid()::text = buyer_id);

create policy "允許已登入用戶新增解鎖紀錄"
  on public.unlocks for insert
  to authenticated
  with check (auth.uid()::text = buyer_id);

-- 3b. 課程表（刊登課程用，詳見 courses.sql 亦可單獨執行）
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  tutor_id text references public.tutors(id) on delete cascade not null,
  title text not null,
  subject text,
  subject_category text,
  region_city text,
  region_district text,
  mode text default 'hybrid',
  hourly_rate integer,
  description text,
  first_lesson_free boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.courses enable row level security;
drop policy if exists "允許所有人公開讀取課程" on public.courses;
drop policy if exists "允許公開新增課程" on public.courses;
drop policy if exists "允許公開更新課程" on public.courses;
drop policy if exists "允許公開刪除課程" on public.courses;
drop policy if exists "允許已登入用戶新增自己的課程" on public.courses;
drop policy if exists "允許已登入用戶更新自己的課程" on public.courses;
drop policy if exists "允許已登入用戶刪除自己的課程" on public.courses;

create policy "允許所有人公開讀取課程" on public.courses for select using (true);
create policy "允許已登入用戶新增自己的課程"
  on public.courses for insert to authenticated
  with check (auth.uid()::text = tutor_id);
create policy "允許已登入用戶更新自己的課程"
  on public.courses for update to authenticated
  using (auth.uid()::text = tutor_id) with check (auth.uid()::text = tutor_id);
create policy "允許已登入用戶刪除自己的課程"
  on public.courses for delete to authenticated
  using (auth.uid()::text = tutor_id);

-- ========================================================
-- 4. 示範導師 Seed
-- 請另於 SQL Editor 執行 supabase/seed_tutors_refresh.sql（18 位）
-- 前端列表也會合併 MOCK_TUTORS，真實註冊導師不受影響
-- ========================================================
