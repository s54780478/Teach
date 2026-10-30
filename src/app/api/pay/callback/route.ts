import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { upsertActiveSubscription } from '@/lib/payments/subscriptionDb';
import {
  decryptNewebpayNotify,
  extractUserIdFromPeriodMemo,
  getNewebpayCredentials,
  verifyCheckCode,
} from '@/lib/payments/newebpay';
import { addMonths, STUDENT_PASS_MONTHS } from '@/lib/payments/config';

export const runtime = 'nodejs';

async function activateByUserId(userId: string, providerRef: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false as const, error: '缺少 SUPABASE_SERVICE_ROLE_KEY' };
  }
  const result = await upsertActiveSubscription(admin, {
    userId,
    provider: 'newebpay',
    providerRef,
    months: STUDENT_PASS_MONTHS,
  });
  if (!result.success) {
    return { ok: false as const, error: result.error || '寫入失敗' };
  }
  return { ok: true as const, row: result.row };
}

async function activateByMerchantOrderNo(
  merchantOrderNo: string,
  providerRef: string,
  memoUserId?: string | null
) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false as const, error: '缺少 SUPABASE_SERVICE_ROLE_KEY' };
  }

  // 1) PeriodMemo / 自訂欄位直接帶 user id
  if (memoUserId) {
    return activateByUserId(memoUserId, providerRef);
  }

  // 2) 以 pending 訂單 provider_ref = MerOrderNo 對應
  const { data: pending } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('provider_ref', merchantOrderNo)
    .maybeSingle();

  if (pending?.user_id) {
    return activateByUserId(pending.user_id as string, providerRef || merchantOrderNo);
  }

  return { ok: false as const, error: `找不到訂單 ${merchantOrderNo} 對應使用者` };
}

function isAuthSuccess(payload: Record<string, unknown>): boolean {
  const status = String(payload.Status || '').toUpperCase();
  const respondCode = String(
    payload.RespondCode ||
      (payload.Result as Record<string, unknown> | undefined)?.RespondCode ||
      ''
  );
  if (status && status !== 'SUCCESS' && status !== '') {
    // 內層 Result 也可能是成功
    if (respondCode !== '00') return false;
  }
  if (respondCode && respondCode !== '00') return false;
  // 定期每期通知不一定有 Status=SUCCESS，看 RespondCode
  return respondCode === '00' || status === 'SUCCESS' || Boolean(payload.AuthCode);
}

/**
 * 藍新背景通知（定期定額 Period Notify / 信用卡 Notify）
 * POST /api/pay/callback?provider=newebpay
 */
async function handleNewebpay(req: NextRequest) {
  const { HashKey, HashIV, MerchantID } = getNewebpayCredentials();
  if (!HashKey || !HashIV) {
    return new NextResponse('Missing NewebPay keys', { status: 500 });
  }

  const contentType = req.headers.get('content-type') || '';
  let encrypted = '';
  let formMap: Record<string, string> = {};

  if (contentType.includes('application/json')) {
    const json = (await req.json().catch(() => ({}))) as Record<string, string>;
    encrypted = json.Period || json.TradeInfo || json.EncryptData || '';
    formMap = json;
  } else {
    const form = await req.formData();
    form.forEach((value, key) => {
      formMap[key] = String(value);
    });
    encrypted = formMap.Period || formMap.TradeInfo || formMap.EncryptData || '';
  }

  if (!encrypted) {
    console.warn('⚠️ 藍新 Notify 缺少 Period/TradeInfo', formMap);
    return new NextResponse('OK', { status: 200 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = decryptNewebpayNotify(encrypted, HashKey, HashIV);
  } catch (err) {
    console.error('⚠️ 藍新 Notify 解密失敗:', err);
    return new NextResponse('Decrypt Error', { status: 400 });
  }

  // 解開 Result 巢狀
  const result =
    payload.Result && typeof payload.Result === 'object'
      ? (payload.Result as Record<string, unknown>)
      : payload;

  const merged: Record<string, unknown> = { ...payload, ...result };

  if (!isAuthSuccess(merged)) {
    console.warn('⚠️ 藍新授權未成功:', merged.Status, merged.Message, merged.RespondCode);
    return new NextResponse('OK', { status: 200 });
  }

  const merchantOrderNo = String(
    merged.MerchantOrderNo || merged.MerOrderNo || ''
  );
  // OrderNo 格式可能為 MerOrderNo_期數
  const orderNo = String(merged.OrderNo || '');
  const baseOrder =
    merchantOrderNo ||
    (orderNo.includes('_') ? orderNo.split('_')[0] : orderNo);

  const tradeNo = String(merged.TradeNo || merged.PeriodNo || baseOrder);
  const memoUserId =
    extractUserIdFromPeriodMemo(merged.PeriodMemo) ||
    extractUserIdFromPeriodMemo(formMap.PeriodMemo);

  // CheckCode（若有）
  if (merged.CheckCode && merged.TradeNo) {
    const ok = verifyCheckCode(
      {
        Amt: String(merged.AuthAmt || merged.PeriodAmt || merged.Amt || ''),
        MerchantID: String(merged.MerchantID || MerchantID),
        MerchantOrderNo: baseOrder,
        TradeNo: String(merged.TradeNo),
        CheckCode: String(merged.CheckCode),
      },
      HashKey,
      HashIV
    );
    if (!ok) {
      console.warn('⚠️ 藍新 CheckCode 驗證失敗');
      return new NextResponse('CheckCode Error', { status: 400 });
    }
  }

  const activated = await activateByMerchantOrderNo(baseOrder, tradeNo, memoUserId);
  if (!activated.ok) {
    console.error('⚠️ 藍新開通失敗:', activated.error);
    // 仍回 200 避免藍新重試風暴；日誌排查
  } else {
    // 若通知含 NextAuthDate，可延長到期（續期）
    const nextAuth = merged.NextAuthDate;
    if (typeof nextAuth === 'string' && nextAuth && activated.row) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const end = new Date(nextAuth.replace(/-/g, '/'));
        if (!Number.isNaN(end.getTime())) {
          // 下一期授權日前一天視為本期結束；否則至少加一個月
          const periodEnd =
            end.getTime() > Date.now()
              ? end.toISOString()
              : addMonths(new Date(), STUDENT_PASS_MONTHS).toISOString();
          await admin
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', activated.row.user_id);
        }
      }
    }
  }

  return new NextResponse('OK', { status: 200 });
}

export async function POST(req: NextRequest) {
  const provider = (req.nextUrl.searchParams.get('provider') || 'newebpay').toLowerCase();

  try {
    if (provider === 'newebpay' || provider === 'neweb' || !provider) {
      return await handleNewebpay(req);
    }
    return NextResponse.json({ error: '未知 provider，請使用 newebpay' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'callback 失敗';
    console.error('⚠️ /api/pay/callback:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: '藍新 NotifyURL 請 POST 至此：/api/pay/callback?provider=newebpay',
  });
}
