-- ========================================================
-- 修復 tutors RLS：允許寫入（INSERT / UPDATE）
-- 請在 Supabase Dashboard → SQL Editor 整段執行
-- ========================================================

-- 確認 RLS 已開啟（不影響既有資料）
alter table public.tutors enable row level security;

-- 移除舊政策（名稱需與先前建立的一致）
drop policy if exists "允許已登入用戶新增自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶更新自己的履歷" on public.tutors;
drop policy if exists "允許公開新增導師履歷" on public.tutors;
drop policy if exists "允許公開更新導師履歷" on public.tutors;
drop policy if exists "允許所有人公開讀取導師列表" on public.tutors;

-- 讀取：所有人可看導師列表
create policy "允許所有人公開讀取導師列表"
  on public.tutors for select
  using (true);

-- 新增：MVP 階段允許 anon / authenticated 寫入
-- （解決 new row violates row-level security policy）
create policy "允許公開新增導師履歷"
  on public.tutors for insert
  with check (true);

-- 更新：允許更新既有履歷（編輯頁 upsert 需要）
create policy "允許公開更新導師履歷"
  on public.tutors for update
  using (true)
  with check (true);
