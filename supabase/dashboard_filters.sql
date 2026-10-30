-- ========================================================
-- 導師後台上架狀態 + 列表篩選支援欄位
-- 請在 Supabase SQL Editor 執行（courses 表已存在後）
-- ========================================================

-- courses：上架 / 下架
alter table public.courses
  add column if not exists status text default 'active';

update public.courses set status = 'active' where status is null;

-- tutors：是否公開出現在列表
alter table public.tutors
  add column if not exists is_published boolean default true;

update public.tutors set is_published = true where is_published is null;

create index if not exists courses_status_idx on public.courses (status);
create index if not exists tutors_hourly_rate_idx on public.tutors (hourly_rate);
create index if not exists tutors_is_published_idx on public.tutors (is_published);
