-- ========================================================
-- 標籤防禦：正規化、隔離區、pg_trgm 模糊搜尋、檢舉自動隱藏
-- 依賴：先執行 taxonomy.sql；可重複執行
-- ========================================================

-- 1) 狀態擴充：disabled（檢舉／人工下架）
alter table public.tags
  drop constraint if exists tags_status_check;

alter table public.tags
  add constraint tags_status_check
  check (status in ('pending', 'approved', 'disabled'));

alter table public.tags
  add column if not exists report_count integer not null default 0;

alter table public.tags
  add column if not exists display_name text;

-- 既有列：補 display_name
update public.tags
set display_name = coalesce(nullif(display_name, ''), name)
where display_name is null;

-- 2) 唯一鍵改為正規化後的 name（小寫／NFKC 由應用層寫入）
-- 若舊資料有大小寫重複，先合併需人工處理；此處僅確保約束存在
create unique index if not exists tags_name_unique_idx on public.tags (name);

-- 3) 公開選單視圖：僅 approved 且 usage_count >= 5，排除 disabled
create or replace view public.tags_public_menu as
select *
from public.tags
where status = 'approved'
  and usage_count >= 5;

-- 4) pg_trgm 模糊搜尋
create extension if not exists pg_trgm;

create index if not exists tags_name_trgm_idx
  on public.tags using gin (name gin_trgm_ops);

create index if not exists tags_display_trgm_idx
  on public.tags using gin (display_name gin_trgm_ops);

-- 模糊搜尋 RPC：排除 disabled；公開模式僅 approved+熱門
create or replace function public.search_tags_fuzzy(
  q text,
  lim integer default 20,
  public_only boolean default true
)
returns table (
  id uuid,
  name text,
  display_name text,
  category_id text,
  subcategory_id text,
  status text,
  usage_count integer,
  score real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.name,
    coalesce(t.display_name, t.name) as display_name,
    t.category_id,
    t.subcategory_id,
    t.status,
    t.usage_count,
    greatest(
      similarity(t.name, lower(trim(q))),
      similarity(coalesce(t.display_name, t.name), lower(trim(q)))
    ) as score
  from public.tags t
  where t.status <> 'disabled'
    and (
      not public_only
      or (t.status = 'approved' and t.usage_count >= 5)
    )
    and (
      t.name % lower(trim(q))
      or coalesce(t.display_name, t.name) % lower(trim(q))
      or t.name ilike '%' || lower(trim(q)) || '%'
      or coalesce(t.display_name, t.name) ilike '%' || lower(trim(q)) || '%'
    )
  order by score desc, t.usage_count desc
  limit greatest(1, least(coalesce(lim, 20), 50));
$$;

grant execute on function public.search_tags_fuzzy(text, integer, boolean) to anon, authenticated;

-- 5) 檢舉表
create table if not exists public.tag_reports (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id) on delete cascade,
  reporter_id uuid not null,
  reason text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint tag_reports_unique_reporter unique (tag_id, reporter_id)
);

create index if not exists tag_reports_tag_idx on public.tag_reports (tag_id);

alter table public.tag_reports enable row level security;

drop policy if exists "tag_reports_auth_insert" on public.tag_reports;
create policy "tag_reports_auth_insert"
  on public.tag_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "tag_reports_own_read" on public.tag_reports;
create policy "tag_reports_own_read"
  on public.tag_reports for select to authenticated
  using (auth.uid() = reporter_id);

-- 6) 檢舉達 3 次 → disabled
create or replace function public.hide_tag_on_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt integer;
begin
  select count(*)::integer into cnt from public.tag_reports where tag_id = new.tag_id;
  update public.tags
  set
    report_count = cnt,
    status = case when cnt >= 3 then 'disabled' else status end
  where id = new.tag_id
    and status <> 'disabled';
  return new;
end;
$$;

drop trigger if exists tag_reports_auto_hide on public.tag_reports;
create trigger tag_reports_auto_hide
  after insert on public.tag_reports
  for each row
  execute function public.hide_tag_on_reports();

-- 7) 升格條件：usage_count >= 5 且非 disabled
create or replace function public.promote_popular_tags()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'disabled' then
    return new;
  end if;
  if new.usage_count >= 5 and new.status = 'pending' then
    new.status := 'approved';
  end if;
  return new;
end;
$$;

-- 8) 公開讀取 tags：disabled 對匿名不可見（pending 仍可讀以利個人頁；選單用 view／RPC）
drop policy if exists "tags_public_read" on public.tags;
create policy "tags_public_read"
  on public.tags for select
  using (status <> 'disabled');

-- 已登入者可讀自己建立的 disabled（可選）
drop policy if exists "tags_owner_read_disabled" on public.tags;
create policy "tags_owner_read_disabled"
  on public.tags for select to authenticated
  using (status = 'disabled' and created_by_user_id = auth.uid());
