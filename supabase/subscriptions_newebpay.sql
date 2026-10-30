-- ========================================================
-- 允許 subscriptions.provider = newebpay（藍新）
-- 請在已執行 subscriptions.sql 後於 SQL Editor 執行
-- ========================================================

alter table public.subscriptions
  drop constraint if exists subscriptions_provider_check;

alter table public.subscriptions
  add constraint subscriptions_provider_check
  check (
    provider is null
    or provider in ('newebpay', 'demo', 'ecpay', 'stripe')
  );
