-- ========================================================
-- tutors / courses 寫入政策（已收緊：僅本人可改）
-- 建議改執行 rls_harden.sql（涵蓋 unlocks / profiles / subscriptions）
-- ========================================================

alter table public.tutors enable row level security;

drop policy if exists "允許已登入用戶新增自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶更新自己的履歷" on public.tutors;
drop policy if exists "允許已登入用戶刪除自己的履歷" on public.tutors;
drop policy if exists "允許公開新增導師履歷" on public.tutors;
drop policy if exists "允許公開更新導師履歷" on public.tutors;
drop policy if exists "允許所有人公開讀取導師列表" on public.tutors;

create policy "允許所有人公開讀取導師列表"
  on public.tutors for select
  using (true);

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
