-- 公開師資檢視：不含 LINE／電話／email（買方解鎖制的 DB 層防線）
-- 前端已對列表 redact；正式環境請改讓 anon 只能讀此 view 或 RPC，勿 select * from tutors。

create or replace view public.tutors_public
with (security_invoker = true)
as
select
  id,
  name,
  headline,
  bio,
  avatar_url,
  degree,
  specialty_tags,
  subject_category,
  main_category,
  category_id,
  city,
  district,
  display_location,
  mode,
  teaching_modes,
  hourly_rate,
  first_lesson_free,
  free_lesson_minutes,
  response_time,
  response_speed_minutes,
  taught_hours,
  rating,
  review_count,
  badge,
  is_published,
  is_verified,
  is_identity_verified,
  is_diploma_verified,
  youtube_url
from public.tutors
where is_published is true or is_published is null;

grant select on public.tutors_public to anon, authenticated;

comment on view public.tutors_public is
  'Public tutor catalog without contact columns. Use resolveTutorContact / owner policies for LINE/phone.';
