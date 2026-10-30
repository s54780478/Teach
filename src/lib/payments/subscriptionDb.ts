import type { SupabaseClient } from '@supabase/supabase-js';
import {
  addMonths,
  STUDENT_PASS_MONTHS,
  STUDENT_PASS_PLAN,
  type PaymentProvider,
} from '@/lib/payments/config';

export type SubscriptionStatus =
  | 'active'
  | 'inactive'
  | 'canceled'
  | 'past_due'
  | 'pending';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan: string;
  provider: string | null;
  provider_ref: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export function isSubscriptionActive(row: SubscriptionRow | null | undefined): boolean {
  if (!row || row.status !== 'active') return false;
  if (!row.current_period_end) return false;
  return new Date(row.current_period_end).getTime() > Date.now();
}

/** 開通／續期 Student Pass（service role 或 RLS 允許時） */
export async function upsertActiveSubscription(
  client: SupabaseClient,
  input: {
    userId: string;
    provider: PaymentProvider;
    providerRef?: string | null;
    months?: number;
  }
): Promise<{ success: boolean; row?: SubscriptionRow; error?: string }> {
  const now = new Date();
  const months = input.months ?? STUDENT_PASS_MONTHS;
  const periodEnd = addMonths(now, months);

  const payload = {
    user_id: input.userId,
    status: 'active' as const,
    plan: STUDENT_PASS_PLAN,
    provider: input.provider,
    provider_ref: input.providerRef ?? null,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  const { data, error } = await client
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, row: data as SubscriptionRow };
}

export async function markSubscriptionCanceled(
  client: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await client
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getSubscriptionByUserId(
  client: SupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SubscriptionRow;
}
