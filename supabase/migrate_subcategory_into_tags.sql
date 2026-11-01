-- ========================================================
-- Migration：子分類 → tags，並移除 tutors.subcategory_id
-- 依賴：先有 specialty_tags、可選 main_category
-- 於 Supabase SQL Editor 整段執行（可重跑；欄位已刪則跳過）
-- ========================================================

create extension if not exists pg_trgm;

-- 0. 確保 main_category 存在（與 main_category.sql 對齊）
alter table public.tutors
  add column if not exists main_category text;

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

-- 1. 將 subcategory 名稱合併進 specialty_tags（NFKC 清洗＋去重，最多 5）
do $$
declare
  has_sub boolean;
  r record;
  raw_tags text[];
  elem text;
  display text;
  key text;
  seen text[];
  final_tags text[];
  sub_name text;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tutors'
      and column_name = 'subcategory_id'
  ) into has_sub;

  if not has_sub then
    raise notice 'tutors.subcategory_id 已不存在，跳過合併';
    return;
  end if;

  for r in
    select
      t.id,
      coalesce(t.specialty_tags, '{}'::text[]) as specialty_tags,
      s.name as sub_name
    from public.tutors t
    left join public.subcategories s on s.id = t.subcategory_id
  loop
    raw_tags := r.specialty_tags;
    sub_name := nullif(trim(coalesce(r.sub_name, '')), '');
    if sub_name is not null then
      raw_tags := array_append(raw_tags, sub_name);
    end if;

    seen := '{}'::text[];
    final_tags := '{}'::text[];

    foreach elem in array raw_tags loop
      if elem is null then
        continue;
      end if;
      -- NFKC + trim；顯示名保留清洗後原大小寫風格
      display := trim(normalize(elem, nfkc));
      display := regexp_replace(display, '[[:punct:]]+', ' ', 'g');
      display := regexp_replace(display, '\s+', ' ', 'g');
      display := trim(display);
      if display is null or char_length(display) < 2 then
        continue;
      end if;
      key := lower(display);
      if key = any (seen) then
        continue;
      end if;
      seen := array_append(seen, key);
      final_tags := array_append(final_tags, display);
      exit when coalesce(array_length(final_tags, 1), 0) >= 5;
    end loop;

    update public.tutors
    set
      specialty_tags = final_tags,
      subcategory_id = null
    where id = r.id;
  end loop;

  raise notice '已將 subcategory 合併至 specialty_tags';
end $$;

-- 2. 補齊 main_category（若仍空）
update public.tutors
set main_category = case
  when main_category in (
    'languages','academic','technology','arts_music','sports_fitness',
    'career_exams','lifestyle_hobbies','personal_development'
  ) then main_category
  when category_id in (
    'languages','academic','technology','arts_music','sports_fitness',
    'career_exams','lifestyle_hobbies','personal_development'
  ) then category_id
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
  else coalesce(main_category, 'lifestyle_hobbies')
end
where main_category is null
   or main_category not in (
     'languages','academic','technology','arts_music','sports_fitness',
     'career_exams','lifestyle_hobbies','personal_development'
   );

alter table public.tutors drop constraint if exists tutors_main_category_check;
alter table public.tutors
  add constraint tutors_main_category_check
  check (
    main_category is null
    or main_category in (
      'languages','academic','technology','arts_music','sports_fitness',
      'career_exams','lifestyle_hobbies','personal_development'
    )
  );

create index if not exists tutors_main_category_idx on public.tutors (main_category);

-- 3. 確認合併後移除 tutors.subcategory_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tutors'
      and column_name = 'subcategory_id'
  ) then
    alter table public.tutors drop column subcategory_id;
    raise notice '已移除 tutors.subcategory_id';
  end if;
end $$;

-- 4. 熱門標籤 RPC（Steam 聚合；與 main_category.sql 一致）
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
