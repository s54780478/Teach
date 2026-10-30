import { supabase } from '@/lib/supabaseClient';
import {
  activateStudentPass,
  deactivateStudentPass,
  readStudentPass,
  writeStudentPass,
  type StudentPassState,
} from '@/lib/studentPassStorage';
import {
  getSubscriptionByUserId,
  isSubscriptionActive,
  markSubscriptionCanceled,
  upsertActiveSubscription,
  type SubscriptionRow,
} from '@/lib/payments/subscriptionDb';
import type { NewebpayCardInput } from '@/lib/payments/newebpay';

export type { SubscriptionRow, NewebpayCardInput };

export interface CheckoutResult {
  mode: 'newebpay' | 'demo';
  paymentConfigured: boolean;
  method?: 'card' | 'period';
  url?: string;
  action?: string;
  fields?: Record<string, string>;
  activated?: boolean;
  activateClientSide?: boolean;
  amount?: number;
  error?: string;
  subscription?: SubscriptionRow;
  tradeNo?: string;
  merchantOrderNo?: string;
}

function rowToPassState(row: SubscriptionRow | null): StudentPassState {
  if (!row || !isSubscriptionActive(row)) {
    return {
      active: false,
      expiresAt: null,
      planLabel: 'Student Pass',
      activatedAt: null,
    };
  }
  return {
    active: true,
    expiresAt: row.current_period_end,
    planLabel: 'Student Pass 月費',
    activatedAt: row.current_period_start,
  };
}

/** 向 Supabase 查詢真實訂閱；失敗則降級 LocalStorage */
export async function fetchStudentPassState(
  userId?: string | null
): Promise<StudentPassState> {
  if (!userId) {
    return readStudentPass(null);
  }

  try {
    const row = await getSubscriptionByUserId(supabase, userId);
    if (row) {
      const state = rowToPassState(row);
      writeStudentPass(state, userId);
      return state;
    }
  } catch (err) {
    console.warn('⚠️ 讀取 subscriptions 失敗，改用 LocalStorage:', err);
  }

  return readStudentPass(userId);
}

/** 演示開通：優先寫 Supabase，並同步 LocalStorage */
export async function activateStudentPassSubscription(
  userId?: string | null,
  months: number = 1
): Promise<StudentPassState> {
  if (!userId) {
    return activateStudentPass(null, months);
  }

  try {
    const result = await upsertActiveSubscription(supabase, {
      userId,
      provider: 'demo',
      providerRef: `demo_client_${Date.now()}`,
      months,
    });
    if (result.success && result.row) {
      const state = rowToPassState(result.row);
      writeStudentPass(state, userId);
      return state;
    }
    console.warn('⚠️ Demo upsert subscriptions 提示:', result.error);
  } catch (err) {
    console.warn('⚠️ Demo 寫入 subscriptions 異常:', err);
  }

  return activateStudentPass(userId, months);
}

export async function cancelStudentPassSubscription(
  userId?: string | null
): Promise<StudentPassState> {
  if (userId) {
    try {
      await markSubscriptionCanceled(supabase, userId);
    } catch (err) {
      console.warn('⚠️ 取消訂閱寫入失敗:', err);
    }
  }
  return deactivateStudentPass(userId);
}

export interface StartCheckoutOptions {
  /** demo | newebpay */
  provider?: 'newebpay' | 'demo';
  /** card=站內直刷；period=定期定額導向藍新頁 */
  mode?: 'card' | 'period';
  card?: NewebpayCardInput;
}

/** 呼叫 /api/checkout：藍新直刷／定期定額／演示開通 */
export async function startStudentPassCheckout(
  userId: string,
  options: StartCheckoutOptions = {}
): Promise<CheckoutResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      mode: 'demo',
      paymentConfigured: false,
      error: '請先登入',
    };
  }

  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider: options.provider,
      mode: options.mode || (options.card ? 'card' : undefined),
      card: options.card,
    }),
  });

  const payload = (await res.json()) as CheckoutResult & { error?: string };
  if (!res.ok) {
    return {
      mode: payload.mode || 'newebpay',
      paymentConfigured: Boolean(payload.paymentConfigured),
      error: payload.error || '結帳失敗',
    };
  }

  if (payload.mode === 'newebpay' && payload.action && payload.fields) {
    submitNewebpayForm(payload.action, payload.fields);
    return payload;
  }

  if (payload.mode === 'newebpay' && payload.activated && payload.subscription) {
    const state = rowToPassState(payload.subscription);
    writeStudentPass(state, userId);
    return payload;
  }

  if (payload.mode === 'demo') {
    if (payload.activated && payload.subscription) {
      const state = rowToPassState(payload.subscription);
      writeStudentPass(state, userId);
      return payload;
    }
    if (payload.activateClientSide) {
      await activateStudentPassSubscription(userId, 1);
      return { ...payload, activated: true };
    }
  }

  return payload;
}

function submitNewebpayForm(action: string, fields: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export async function fetchPaymentConfig(): Promise<{
  paymentConfigured: boolean;
  providers: { newebpay: boolean; demo: boolean };
  amount: number;
  supportsCardForm: boolean;
}> {
  try {
    const res = await fetch('/api/checkout');
    if (!res.ok) throw new Error('config failed');
    return (await res.json()) as {
      paymentConfigured: boolean;
      providers: { newebpay: boolean; demo: boolean };
      amount: number;
      supportsCardForm: boolean;
    };
  } catch {
    return {
      paymentConfigured: false,
      providers: { newebpay: false, demo: true },
      amount: 499,
      supportsCardForm: false,
    };
  }
}
