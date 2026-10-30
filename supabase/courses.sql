-- ========================================================
-- courses：導師刊登的課程列（與 tutors 關聯）
-- 請在 Supabase SQL Editor 執行
-- ========================================================

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

create index if not exists courses_tutor_id_idx on public.courses (tutor_id);
create index if not exists courses_subject_idx on public.courses (subject);
create index if not exists courses_region_city_idx on public.courses (region_city);

alter table public.courses enable row level security;

drop policy if exists "允許所有人公開讀取課程" on public.courses;
create policy "允許所有人公開讀取課程"
  on public.courses for select
  using (true);

drop policy if exists "允許公開新增課程" on public.courses;
create policy "允許公開新增課程"
  on public.courses for insert
  with check (true);

drop policy if exists "允許公開更新課程" on public.courses;
create policy "允許公開更新課程"
  on public.courses for update
  using (true)
  with check (true);

drop policy if exists "允許公開刪除課程" on public.courses;
create policy "允許公開刪除課程"
  on public.courses for delete
  using (true);
