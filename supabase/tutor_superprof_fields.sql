-- ========================================================
-- Superprof 卡片欄位擴充（請在 Supabase SQL Editor 執行）
-- free_first_lesson ≡ 既有 first_lesson_free
-- ========================================================

alter table public.tutors
  add column if not exists teaching_modes text[] default array['online','in_person','student_home']::text[];

alter table public.tutors
  add column if not exists free_lesson_minutes integer default 60;

alter table public.tutors
  add column if not exists response_time text default '通常在 1 小時內回覆';

alter table public.tutors
  add column if not exists is_verified boolean default false;

alter table public.tutors
  add column if not exists is_identity_verified boolean default false;

alter table public.tutors
  add column if not exists is_diploma_verified boolean default false;

-- 既有列：由舊 mode 回填 teaching_modes
update public.tutors
set teaching_modes = case mode
  when 'online' then array['online']::text[]
  when 'in-person' then array['in_person','student_home']::text[]
  else array['online','in_person','student_home']::text[]
end
where teaching_modes is null or cardinality(teaching_modes) = 0;

update public.tutors
set response_time = coalesce(nullif(trim(response_time), ''), '通常在 1 小時內回覆')
where response_time is null or trim(response_time) = '';

update public.tutors
set free_lesson_minutes = 60
where free_lesson_minutes is null;

comment on column public.tutors.first_lesson_free is 'Superprof free_first_lesson：是否提供第一堂課免費';
comment on column public.tutors.teaching_modes is 'online | in_person | student_home';
comment on column public.tutors.response_time is '卡片顯示用回覆速度文案';
comment on column public.tutors.is_verified is '身分／學歷驗證綜合標章';
