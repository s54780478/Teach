-- ========================================================
-- 導師自我介紹影片：tutors.youtube_url
-- 於 Supabase SQL Editor 整段執行（可重跑）
-- ========================================================

alter table public.tutors
  add column if not exists youtube_url text;

comment on column public.tutors.youtube_url is
  'YouTube 自我介紹影片（僅存 canonical watch URL；前端轉 embed）';

-- 輕量格式約束：空或 https YouTube 網址（細部 video_id 由應用層校驗）
alter table public.tutors drop constraint if exists tutors_youtube_url_check;
alter table public.tutors
  add constraint tutors_youtube_url_check
  check (
    youtube_url is null
    or length(trim(youtube_url)) = 0
    or youtube_url ~* '^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)'
  );
