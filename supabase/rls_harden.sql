-- ========================================================
-- idaltu RLS 收緊（請在 Supabase SQL Editor 整段執行）
-- 目標：RLS 開啟 + 外人無法用 anon key 亂改資料
-- ========================================================

-- 清除安全探測殘留列（若存在）
delete from public.tutors where id = 'security-probe-delete-me';

-- ---------- tutors ----------
alter table public.tutors enable row level security;

drop policy if exists "允許所有人公開讀取導師列表" on public.tutors;
drop policy if exists "允許公開新增導師履歷" on public.tutors;
drop policy if exists "允許公開更新導師履歷" on public.tutors;
drop policy if exists "允許公開刪除導師履歷" on public.tutors;
drop policy if exists "允許已登入用戶新增自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶更新自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶刪除自己的履歷" on public.tutors;

-- 公開讀取（列表／履歷頁）
create policy "允許所有人公開讀取導師列表"
  on public.tutors for select
  using (true);

-- 僅本人可寫入（id 必須等於 auth.uid()）
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

-- ---------- courses ----------
alter table public.courses enable row level security;

drop policy if exists "允許所有人公開讀取課程" on public.courses;
drop policy if exists "允許公開新增課程" on public.courses;
drop policy if exists "允許公開更新課程" on public.courses;
drop policy if exists "允許公開刪除課程" on public.courses;
drop policy if exists "允許已登入用戶管理自己的課程" on public.courses;
drop policy if exists "允許已登入用戶新增自己的課程" on public.courses;
drop policy if exists "允許已登入用戶更新自己的課程" on public.courses;
drop policy if exists "允許已登入用戶刪除自己的課程" on public.courses;

create policy "允許所有人公開讀取課程"
  on public.courses for select
  using (true);

create policy "允許已登入用戶新增自己的課程"
  on public.courses for insert
  to authenticated
  with check (auth.uid()::text = tutor_id);

create policy "允許已登入用戶更新自己的課程"
  on public.courses for update
  to authenticated
  using (auth.uid()::text = tutor_id)
  with check (auth.uid()::text = tutor_id);

create policy "允許已登入用戶刪除自己的課程"
  on public.courses for delete
  to authenticated
  using (auth.uid()::text = tutor_id);

-- ---------- unlocks ----------
alter table public.unlocks enable row level security;

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

-- ---------- profiles（若表存在）----------
do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';
    execute 'drop policy if exists "允許使用者讀取自己的 profile" on public.profiles';
    execute 'drop policy if exists "允許使用者更新自己的 profile" on public.profiles';
    execute 'drop policy if exists "允許使用者新增自己的 profile" on public.profiles';
    execute 'create policy "允許使用者讀取自己的 profile" on public.profiles for select to authenticated using (auth.uid() = id)';
    execute 'create policy "允許使用者更新自己的 profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id)';
    execute 'create policy "允許使用者新增自己的 profile" on public.profiles for insert to authenticated with check (auth.uid() = id)';
  end if;
end $$;

-- ---------- subscriptions（若表存在）----------
do $$
begin
  if to_regclass('public.subscriptions') is not null then
    execute 'alter table public.subscriptions enable row level security';
    execute 'drop policy if exists "允許使用者讀取自己的訂閱" on public.subscriptions';
    execute 'drop policy if exists "允許使用者新增自己的訂閱" on public.subscriptions';
    execute 'drop policy if exists "允許使用者更新自己的訂閱" on public.subscriptions';
    execute 'create policy "允許使用者讀取自己的訂閱" on public.subscriptions for select to authenticated using (auth.uid() = user_id)';
    execute 'create policy "允許使用者新增自己的訂閱" on public.subscriptions for insert to authenticated with check (auth.uid() = user_id)';
    execute 'create policy "允許使用者更新自己的訂閱" on public.subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;
