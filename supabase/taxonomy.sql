-- ========================================================
-- idaltu 三層技能／科目分類（Categories → Subcategories → Tags）
-- 於 Supabase SQL Editor 執行；可重複執行（idempotent）
-- ========================================================

-- 1. 頂級大類
create table if not exists public.categories (
  id text primary key,
  name text not null,
  icon text,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. 預設子類
create table if not exists public.subcategories (
  id text primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name text not null,
  sort_order integer default 0
);

-- 3. 動態標籤池（社群自訂，無需審核即可使用）
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  category_id text references public.categories(id) on delete set null,
  subcategory_id text references public.subcategories(id) on delete set null,
  name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'disabled')),
  usage_count integer not null default 1,
  report_count integer not null default 0,
  display_name text,
  created_by_user_id uuid,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint tags_name_unique unique (name)
);

create index if not exists tags_name_idx on public.tags (name);
create index if not exists tags_category_idx on public.tags (category_id);
create index if not exists tags_usage_idx on public.tags (usage_count desc);

-- 4. 導師 ↔ 標籤（tutor_id 與 tutors.id 同為 text）
create table if not exists public.tutor_tags (
  tutor_id text not null,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (tutor_id, tag_id)
);

create index if not exists tutor_tags_tag_idx on public.tutor_tags (tag_id);

-- 5. tutors 大類外鍵（細項一律走 specialty_tags；勿再寫 subcategory_id）
alter table public.tutors
  add column if not exists category_id text references public.categories(id) on delete set null;

alter table public.tutors
  add column if not exists main_category text;

-- 舊欄位若仍存在，請執行 migrate_subcategory_into_tags.sql 合併後刪除

-- 6. RLS
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.tags enable row level security;
alter table public.tutor_tags enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select using (true);

drop policy if exists "subcategories_public_read" on public.subcategories;
create policy "subcategories_public_read"
  on public.subcategories for select using (true);

drop policy if exists "tags_public_read" on public.tags;
create policy "tags_public_read"
  on public.tags for select using (true);

drop policy if exists "tags_auth_insert" on public.tags;
create policy "tags_auth_insert"
  on public.tags for insert to authenticated
  with check (true);

drop policy if exists "tags_auth_update" on public.tags;
create policy "tags_auth_update"
  on public.tags for update to authenticated
  using (true)
  with check (true);

drop policy if exists "tutor_tags_public_read" on public.tutor_tags;
create policy "tutor_tags_public_read"
  on public.tutor_tags for select using (true);

drop policy if exists "tutor_tags_owner_write" on public.tutor_tags;
create policy "tutor_tags_owner_write"
  on public.tutor_tags for insert to authenticated
  with check (auth.uid()::text = tutor_id);

drop policy if exists "tutor_tags_owner_delete" on public.tutor_tags;
create policy "tutor_tags_owner_delete"
  on public.tutor_tags for delete to authenticated
  using (auth.uid()::text = tutor_id);

-- 7. 使用次數達門檻自動升格為官方標籤
create or replace function public.promote_popular_tags()
returns trigger
language plpgsql
as $$
begin
  if new.usage_count >= 5 and new.status = 'pending' then
    new.status := 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists tags_auto_promote on public.tags;
create trigger tags_auto_promote
  before update of usage_count on public.tags
  for each row
  execute function public.promote_popular_tags();

-- 8. Seed 大類（固定 8 大，與 src/data/mainCategories.ts 對齊）
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

-- 9. Seed 子類（精簡版；完整建議標籤以前端 taxonomySeed 為準）
insert into public.subcategories (id, category_id, name, sort_order) values
  ('academic-elementary', 'academic', '國小全科／陪讀', 1),
  ('academic-junior-math', 'academic', '國中數學／理化', 2),
  ('academic-senior-math', 'academic', '高中數學', 3),
  ('academic-science', 'academic', '物理／化學／生物', 4),
  ('academic-chinese', 'academic', '國文／作文', 5),
  ('academic-social', 'academic', '社會／公民／地理歷史', 6),
  ('academic-exam', 'academic', '學測／分科／會考衝刺', 7),
  ('lang-english', 'languages', '英文／英語', 1),
  ('lang-ielts-toefl', 'languages', '雅思／托福／多益', 2),
  ('lang-japanese', 'languages', '日文', 3),
  ('lang-korean', 'languages', '韓文', 4),
  ('lang-chinese', 'languages', '華語／中文外師', 5),
  ('lang-other', 'languages', '其他外語', 6),
  ('prog-web', 'technology', '網頁／前端', 1),
  ('prog-python', 'technology', 'Python／資料科學', 2),
  ('prog-app', 'technology', 'App／後端', 3),
  ('prog-kids', 'technology', '兒童程式／創客', 4),
  ('prog-ai', 'technology', 'AI／自動化', 5),
  ('arts-piano', 'arts_music', '鋼琴／鍵盤', 1),
  ('arts-guitar', 'arts_music', '吉他／烏克麗麗', 2),
  ('arts-vocal', 'arts_music', '歌唱／聲樂', 3),
  ('arts-visual', 'arts_music', '美術／插畫／設計', 4),
  ('arts-photo', 'arts_music', '攝影／影像', 5),
  ('arts-other', 'arts_music', '其他樂器／表演', 6),
  ('sports-fitness', 'sports_fitness', '健身／重訓', 1),
  ('sports-yoga', 'sports_fitness', '瑜珈／皮拉提斯', 2),
  ('sports-dance', 'sports_fitness', '舞蹈／有氧', 3),
  ('sports-ball', 'sports_fitness', '球類', 4),
  ('sports-martial', 'sports_fitness', '武術／自衛', 5),
  ('sports-kids', 'sports_fitness', '兒童體能', 6),
  ('pro-office', 'career_exams', '辦公軟體／Excel', 1),
  ('pro-career', 'career_exams', '履歷／面試／轉職', 2),
  ('pro-finance', 'career_exams', '會計／金融／投資入門', 3),
  ('pro-marketing', 'career_exams', '行銷／社群／電商', 4),
  ('pro-certs', 'career_exams', '證照／專業檢定', 5),
  ('pro-design-tools', 'career_exams', '設計工具／剪輯', 6),
  ('life-tutoring', 'lifestyle_hobbies', '陪讀／課後照顧', 1),
  ('life-cooking', 'lifestyle_hobbies', '烹飪／烘焙', 2),
  ('life-craft', 'lifestyle_hobbies', '手作／園藝／興趣', 3),
  ('life-skills', 'lifestyle_hobbies', '生活技能／駕駛', 4),
  ('growth-psych', 'personal_development', '心理學／情緒管理', 1),
  ('growth-comms', 'personal_development', '溝通／人際關係', 2),
  ('growth-habits', 'personal_development', '時間管理／自我成長', 3),
  ('growth-niche', 'personal_development', '其他成長主題', 4)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  sort_order = excluded.sort_order;
