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
-- 4. 寫入現有 8 位在地導師初始假資料 (Seed Data)
-- ========================================================

insert into public.tutors (
  id, name, headline, bio, avatar_url, degree, specialty_tags, 
  subject_category, city, district, display_location, mode, 
  hourly_rate, first_lesson_free, response_speed_minutes, taught_hours, 
  rating, review_count, badge, line_id, phone, email
) values
(
  'tutor-1',
  '林承翰',
  '台大物理所碩士｜用物理直覺解題，不再死記繁複公式',
  '專攻高中物理、學測分科測驗與國中自然會考衝刺。擅長將抽象物理現象拆解為生活化模型，5年輔導經驗，累計帶出超過 30 位第一志願學員。',
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立臺灣大學 物理學研究所碩士',
  array['高中物理', '國中理化', '學測自然', '分科測驗'],
  '數理升學',
  '台北市',
  '大安區',
  '台北市大安區 / 可線上',
  'hybrid',
  950,
  true,
  12,
  180,
  5.0,
  46,
  '金牌導師',
  'lin_physics_ntu',
  '0912-888-321',
  'chenghan.lin@idaltu.tw'
),
(
  'tutor-2',
  '陳玟妤 (Chloe)',
  '英國 UCL 語言學碩士｜雅思 8.5・商務英文口說教練',
  '旅英四年，曾任科技業外語顧問。自創情境式口說法，協助卡關學員在數月內自信開口；專攻雅思口說／寫作與商務簡報英文。全台線上、台北信義可約咖啡廳面談。',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '倫敦大學學院 (UCL) 應用語言學碩士',
  array['雅思衝刺', '商務英文', '成人美語', '留學申請'],
  '外語學習',
  '台北市',
  '信義區',
  '台北市信義區 / 線上專研',
  'online',
  1100,
  true,
  8,
  240,
  4.9,
  38,
  '熱門首選',
  'chloe_ielts_expert',
  '0928-112-990',
  'chloe.chen@idaltu.tw'
),
(
  'tutor-3',
  '張庭瑋',
  '清大資工｜React／TypeScript 實戰與求職作品集',
  '現任美商前端工程師，課程聚焦專案實作：從零做出可上線的 Next.js 應用，並輔導履歷與作品集。適合轉職與資訊相關科系學生，新竹可面授、全台線上。',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立清華大學 資訊工程學系',
  array['React / Next.js', 'Python 入門', '程式設計', '作品集輔導'],
  '程式設計',
  '新竹市',
  '東區',
  '新竹市東區 / 遠端授課',
  'hybrid',
  1200,
  false,
  20,
  95,
  5.0,
  29,
  '金牌導師',
  'tingwei_code_nthu',
  '0933-774-219',
  'tingwei.chang@idaltu.tw'
),
(
  'tutor-4',
  '黃雅涵',
  '師大數學教育｜國中會考數學從 B 衝上 A++',
  '七年國中數學輔導經驗，耐心帶害怕數學的孩子建立心智圖與解題節奏。板橋、新莊可到府或咖啡廳面授，首堂免費試聽。',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立臺灣師範大學 數學教育學系',
  array['國中數學', '會考衝刺', '國小數學', '一對一'],
  '數理升學',
  '新北市',
  '板橋區',
  '新北市板橋區 / 面授限定',
  'in-person',
  800,
  true,
  15,
  320,
  4.9,
  52,
  '熱門首選',
  'ariel_math_ntnu',
  '0955-321-765',
  'ariel.huang@idaltu.tw'
),
(
  'tutor-5',
  '高睿宇',
  '台大化學所｜學測自然・分科化學解題思維',
  '以結構與熱力學邏輯貫穿高中化學，提供重點筆記與客製進度，協助突破模考高原期。台北中正可面授，亦提供線上電子白板。',
  'https://images.unsplash.com/photo-1628155930360-c19fe3c391a5?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立臺灣大學 化學研究所',
  array['高中化學', '分科測驗', '學測自然', '理化'],
  '數理升學',
  '台北市',
  '中正區',
  '台北市中正區 / 線上皆可',
  'hybrid',
  900,
  true,
  10,
  110,
  5.0,
  31,
  '新星特選',
  'ray_chem_ntu',
  '0978-654-321',
  'ray.kao@idaltu.tw'
),
(
  'tutor-6',
  '王詩涵',
  '台日雙語｜JLPT 檢定與生活日文會話',
  '在日交換與商社實習經驗，擅長 JLPT N2–N1 讀解文法，以及旅遊／職場會話。台中可面授，全台線上；課堂融入台灣學生常卡關的漢字與助詞用法。',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立政治大學 日本語文學系',
  array['日文會話', 'JLPT N2', 'JLPT N1', '日文'],
  '外語學習',
  '台中市',
  '西區',
  '台中市西區 / 全台線上',
  'hybrid',
  850,
  true,
  5,
  410,
  5.0,
  64,
  '金牌導師',
  'shihan_nihongo_tw',
  '0981-998-112',
  'shihan.wang@idaltu.tw'
),
(
  'tutor-7',
  '吳采潔',
  '北藝大鋼琴｜流行伴奏與古典基礎並行',
  '專長鋼琴視奏、流行伴奏與古典基本功。零基礎到檢定皆可客製進度，松山工作室面授為主；適合想自彈自唱或培養樂感的國高中生與成人。',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立臺北藝術大學 音樂學系（鋼琴）',
  array['鋼琴', '流行伴奏', '音樂', '唱歌'],
  '音樂藝術',
  '台北市',
  '松山區',
  '台北市松山區 / 個人工作室',
  'in-person',
  1000,
  true,
  25,
  85,
  4.9,
  22,
  '新星特選',
  'tsaijie_piano',
  '0966-443-210',
  'tsaijie.wu@idaltu.tw'
),
(
  'tutor-8',
  '沈佑庭',
  '政大企管所｜學測英文作文與閱測高分策略',
  '專攻學測英文閱測與作文結構，獨創架構式論點鋪陳法，快速掌握主題句與轉折。文山可面授，晚間線上視訊方便高中生排課。',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=800&h=800&q=80&crop=faces',
  '國立政治大學 企業管理研究所',
  array['學測英文', '英文作文', '高中英文', '文法'],
  '外語學習',
  '台北市',
  '文山區',
  '台北市文山區 / 線上視訊',
  'hybrid',
  850,
  true,
  14,
  130,
  4.8,
  19,
  '新星特選',
  'youtting_english_nccu',
  '0921-556-789',
  'youtting.shen@idaltu.tw'
)
on conflict (id) do update set
  name = excluded.name,
  headline = excluded.headline,
  bio = excluded.bio,
  avatar_url = excluded.avatar_url,
  degree = excluded.degree,
  specialty_tags = excluded.specialty_tags,
  subject_category = excluded.subject_category,
  city = excluded.city,
  district = excluded.district,
  display_location = excluded.display_location,
  mode = excluded.mode,
  hourly_rate = excluded.hourly_rate,
  first_lesson_free = excluded.first_lesson_free,
  response_speed_minutes = excluded.response_speed_minutes,
  taught_hours = excluded.taught_hours,
  rating = excluded.rating,
  review_count = excluded.review_count,
  badge = excluded.badge,
  line_id = excluded.line_id,
  phone = excluded.phone,
  email = excluded.email;
