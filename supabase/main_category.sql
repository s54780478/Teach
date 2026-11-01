-- ========================================================
-- 固定 8 大一級分類：tutors.main_category
-- 於 Supabase SQL Editor 整段執行（可重跑）
-- ========================================================

create extension if not exists pg_trgm;

-- 0. 確保 categories 有新 8 key（若已跑過舊 taxonomy seed）
insert into public.categories (id, name, icon, sort_order) values
  ('languages', '語言學習', 'Languages', 1),
  ('academic', '學科升學', 'GraduationCap', 2),
  ('technology', '科技程式', 'Code2', 3),
  ('arts_music', '藝術創作', 'Palette', 4),
  ('sports_fitness', '運動健身', 'Dumbbell', 5),
  ('career_exams', '職涯專業', 'Briefcase', 6),
  ('lifestyle_hobbies', '生活興趣', 'Heart', 7),
  ('personal_development', '個人成長', 'Sparkles', 8)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- 1. 欄位
alter table public.tutors
  add column if not exists main_category text;

-- 2. 舊資料遷移（保留既有導師；依 category_id／subject_category 推導）
update public.tutors
set main_category = case
  when main_category in (
    'languages','academic','technology','arts_music','sports_fitness',
    'career_exams','lifestyle_hobbies','personal_development'
  ) then main_category
  when category_id in ('languages','academic','technology','arts_music','sports_fitness',
    'career_exams','lifestyle_hobbies','personal_development') then category_id
  when category_id = 'programming' then 'technology'
  when category_id = 'arts' then 'arts_music'
  when category_id = 'sports' then 'sports_fitness'
  when category_id = 'professional' then 'career_exams'
  when category_id = 'lifestyle' then 'lifestyle_hobbies'
  when category_id = 'others' then 'personal_development'
  when subject_category in ('語言學習','語言與檢定','外語學習') then 'languages'
  when subject_category in ('學科升學','升學與學科','數理升學','語文寫作') then 'academic'
  when subject_category in ('科技程式','程式與資訊科技','程式設計') then 'technology'
  when subject_category in ('藝術創作','音樂與藝術','音樂藝術') then 'arts_music'
  when subject_category in ('運動健身','運動與健身','體育運動') then 'sports_fitness'
  when subject_category in ('職涯專業','職涯與專業技能','商業金融') then 'career_exams'
  when subject_category in ('生活興趣','生活、陪讀與興趣') then 'lifestyle_hobbies'
  when subject_category in ('個人成長','其他與創新領域','其他') then 'personal_development'
  else 'lifestyle_hobbies'
end
where main_category is null
   or main_category not in (
     'languages','academic','technology','arts_music','sports_fitness',
     'career_exams','lifestyle_hobbies','personal_development'
   );

-- 同步顯示用中文大類（不覆蓋已有細項文案亦可接受）
update public.tutors set subject_category = case main_category
  when 'languages' then '語言學習'
  when 'academic' then '學科升學'
  when 'technology' then '科技程式'
  when 'arts_music' then '藝術創作'
  when 'sports_fitness' then '運動健身'
  when 'career_exams' then '職涯專業'
  when 'lifestyle_hobbies' then '生活興趣'
  when 'personal_development' then '個人成長'
  else subject_category
end
where main_category is not null;

-- 同步 category_id 到新 key（若欄位存在）
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tutors' and column_name = 'category_id'
  ) then
    update public.tutors set category_id = main_category
    where main_category is not null;
  end if;
end $$;

-- 3. CHECK（先丟舊約束再加）
alter table public.tutors drop constraint if exists tutors_main_category_check;
alter table public.tutors
  add constraint tutors_main_category_check
  check (
    main_category is null
    or main_category in (
      'languages',
      'academic',
      'technology',
      'arts_music',
      'sports_fitness',
      'career_exams',
      'lifestyle_hobbies',
      'personal_development'
    )
  );

create index if not exists tutors_main_category_idx
  on public.tutors (main_category);

-- tags 模糊搜尋：需 IMMUTABLE 包一層（array_to_string 本身不能直接當 index expression）
create or replace function public.tutors_specialty_tags_text(tags text[])
returns text
language sql
immutable
parallel safe
as $$
  select array_to_string(coalesce(tags, '{}'::text[]), ' ');
$$;

drop index if exists public.tutors_specialty_tags_trgm_idx;
create index tutors_specialty_tags_trgm_idx
  on public.tutors
  using gin (public.tutors_specialty_tags_text(specialty_tags) gin_trgm_ops);

-- 4. 搜尋 RPC（分類 ∩／∪ 關鍵字 tags）
create or replace function public.search_tutors_catalog(
  p_main_category text default null,
  p_query text default null,
  p_only_published boolean default true
)
returns setof public.tutors
language sql
stable
security invoker
as $$
  select t.*
  from public.tutors t
  where
    (
      not p_only_published
      or t.is_published is true
      or t.is_published is null
    )
    and (
      p_main_category is null
      or length(trim(p_main_category)) = 0
      or t.main_category = p_main_category
    )
    and (
      p_query is null
      or length(trim(p_query)) = 0
      or array_to_string(coalesce(t.specialty_tags, '{}'::text[]), ' ')
           ilike '%' || trim(p_query) || '%'
      or similarity(
           array_to_string(coalesce(t.specialty_tags, '{}'::text[]), ' '),
           trim(p_query)
         ) > 0.12
      or coalesce(t.headline, '') ilike '%' || trim(p_query) || '%'
      or coalesce(t.name, '') ilike '%' || trim(p_query) || '%'
    )
  order by t.rating desc nulls last;
$$;

grant execute on function public.search_tutors_catalog(text, text, boolean) to anon, authenticated;

-- 5. Steam 式熱門標籤聚合（依 main_category 或全站）
create or replace function public.popular_tutor_tags(
  p_main_category text default null,
  p_limit integer default 24,
  p_min_count integer default 2
)
returns table (tag text, count bigint)
language sql
stable
security invoker
as $$
  with exploded as (
    select
      lower(trim(x.tag)) as tag_key,
      trim(x.tag) as tag_display
    from public.tutors t
    cross join lateral unnest(coalesce(t.specialty_tags, '{}'::text[])) as x(tag)
    where
      (t.is_published is true or t.is_published is null)
      and length(trim(x.tag)) >= 2
      and (
        p_main_category is null
        or length(trim(p_main_category)) = 0
        or t.main_category = p_main_category
      )
  ),
  ranked as (
    select
      tag_key,
      max(tag_display) as tag,
      count(*)::bigint as cnt
    from exploded
    where tag_key is not null and length(tag_key) > 0
    group by tag_key
    having count(*) >= greatest(coalesce(p_min_count, 2), 1)
  )
  select tag, cnt as count
  from ranked
  order by cnt desc, tag asc
  limit greatest(coalesce(p_limit, 24), 1);
$$;

grant execute on function public.popular_tutor_tags(text, integer, integer) to anon, authenticated;
