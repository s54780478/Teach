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
  mode text default 'hybrid', -- 'in-person', 'online', 'hybrid'
  hourly_rate integer not null default 800,
  first_lesson_free boolean default true,
  response_speed_minutes integer default 15,
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
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  '國立臺灣大學 物理學研究所碩士',
  array['高中物理', '國中數學', '台大物理系', '學測分科衝刺'],
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
  '英國倫敦大學學院 (UCL) 語言學碩士｜雅思 8.5 雙語口說專家',
  '旅英 4 年，曾任跨國科技業外語顧問。自創情境式沈浸口說法，協助零基礎或卡關學員在 3 個月內自信開口，專攻雅思衝刺與商務英語簡報。',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  '倫敦大學學院 (UCL) 應用語言學碩士',
  array['雅思衝刺', '商務英文', '成人美語口說', '留學申請'],
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
  '清華資工純血系友｜前端與全端工程師實戰帶領',
  '現任知名美商資深前端工程師，精通 React、TypeScript 與系統設計。課程專注於專案實作與求職作品集打造，帶你從零基礎做出可上線的商業級應用。',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  '國立清華大學 資訊工程學系',
  array['React / Next.js', 'Python 入門', '清大資工', '作品集輔導'],
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
  '黃雅涵 (Ariel)',
  '國立師範大學數學系｜讓國中會考數學從 B 衝上 A++ 的溫柔推手',
  '7年國中數學專門輔導經歷，親和力強、極具耐心，專門拯救對數學感到恐懼的孩子。建立清晰思維心智圖，不再死背題型。',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
  '國立臺灣師範大學 數學教育學系',
  array['國中數學', '會考衝刺', '師大數學', '小學奧數思維'],
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
  '高睿宇 (Ray)',
  '台大化學研究所｜學測自然滿級分・分科化學榜首解題思維',
  '擅長以有機化學結構與熱力學邏輯貫穿高中化學全套講義，提供精準重點筆記與一對一客製化進度排程，協助高二高三學生突破模考高原期。',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  '國立臺灣大學 化學研究所',
  array['高中化學', '分科測驗', '台大化學', '自然科素養題'],
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
  '伊藤 美月 (Mizuki)',
  '日本早稻田大學文學部｜道地東京口音，帶你自然說出生活與商務日文',
  '日籍母語導師，具備 6 年在台日語教學經驗。擅長 JLPT N1-N3 檢定精讀與日常生動對話，上課氣氛輕鬆活潑，帶你真正理解日本在地文化脈絡。',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  '早稻田大學 文學學術院',
  array['日文會話', 'JLPT N1-N3', '母語外師', '商務日文'],
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
  'mizuki_nihongo_tw',
  '0981-998-112',
  'mizuki.ito@idaltu.tw'
),
(
  'tutor-7',
  '郭冠廷 (Tim)',
  '柏克萊音樂學院 (Berklee) 校友｜吉他指彈與流行音樂編曲',
  '專長木吉他 Fingerstyle、電吉他即興與 Logic Pro 流行音樂混音製作。無論是零基礎自彈自唱或是進階和弦代理分析，都能讓你感受音樂創作的樂趣。',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  'Berklee College of Music 音樂製作與吉他演奏',
  array['木吉他演奏', '流行編曲', 'Berklee 校友', '歌唱伴奏'],
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
  'tim_guitar_berklee',
  '0966-443-210',
  'tim.kuo@idaltu.tw'
),
(
  'tutor-8',
  '沈佑庭 (Lucas)',
  '政大企管研究所｜高中學測英文 15 級分・指考作文高分策略',
  '專攻學測英文閱測與高分英文作文結構訓練，獨創「架構式論點鋪陳法」，帶你迅速掌握主題句、論述支撐與精準轉折詞，突破寫作瓶頸。',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  '國立政治大學 企業管理研究所',
  array['學測英文作文', '政大商院', '高中英文', '文法架構'],
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
  'lucas_english_nccu',
  '0921-556-789',
  'lucas.shen@idaltu.tw'
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
