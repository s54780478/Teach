import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  isNewebpayConfigured,
  isPaymentConfigured,
  resolveCheckoutProvider,
  STUDENT_PASS_PRICE_TWD,
} from '@/lib/payments/config';
import {
  authorizeCreditCard,
  buildPeriodCheckout,
  createMerchantOrderNo,
  type NewebpayCardInput,
} from '@/lib/payments/newebpay';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { upsertActiveSubscription } from '@/lib/payments/subscriptionDb';

export const runtime = 'nodejs';

async function getUserFromAuthHeader(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

function normalizeCard(raw: unknown): NewebpayCardInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const cardNo = String(o.cardNo || o.CardNo || '').replace(/\s+/g, '');
  const expMonth = String(o.expMonth || o.ExpMonth || '');
  const expYear = String(o.expYear || o.ExpYear || '');
  const cvc = String(o.cvc || o.CVC || '').replace(/\D/g, '');
  if (cardNo.length < 13 || !expMonth || !expYear || cvc.length < 3) return null;
  return { cardNo, expMonth, expYear, cvc };
}

/**
 * POST /api/checkout
 * Body:
 *   { provider?: 'newebpay' | 'demo', mode?: 'card' | 'period', card?: {...} }
 * Header: Authorization: Bearer <supabase access_token>
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (!user) {
      return NextResponse.json({ error: '請先登入後再購買 Student Pass' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      provider?: string;
      mode?: 'card' | 'period';
      card?: unknown;
    };
    const provider = resolveCheckoutProvider(body.provider);

    // ---------- Demo fallback ----------
    if (provider === 'demo') {
      if (isPaymentConfigured() && process.env.ALLOW_DEMO_CHECKOUT !== 'true') {
        return NextResponse.json(
          {
            error: '已設定藍新金流，請使用信用卡結帳',
            paymentConfigured: true,
          },
          { status: 400 }
        );
      }

      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({
          mode: 'demo',
          paymentConfigured: false,
          activateClientSide: true,
          amount: STUDENT_PASS_PRICE_TWD,
          message: '演示模式：請由前端寫入 subscriptions（或設定 SERVICE_ROLE）',
        });
      }

      const result = await upsertActiveSubscription(admin, {
        userId: user.id,
        provider: 'demo',
        providerRef: `demo_${Date.now()}`,
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error || '開通失敗' }, { status: 500 });
      }
      return NextResponse.json({
        mode: 'demo',
        paymentConfigured: false,
        activated: true,
        subscription: result.row,
        amount: STUDENT_PASS_PRICE_TWD,
      });
    }

    // ---------- 藍新 ----------
    if (!isNewebpayConfigured()) {
      return NextResponse.json({ error: '藍新金流尚未設定' }, { status: 500 });
    }

    const merOrderNo = createMerchantOrderNo('SP');
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from('subscriptions').upsert(
        {
          user_id: user.id,
          status: 'pending',
          plan: 'student_pass_monthly',
          provider: 'newebpay',
          provider_ref: merOrderNo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }

    const email = user.email || `${user.id.slice(0, 8)}@idaltu.local`;
    const checkoutMode = body.mode || (body.card ? 'card' : 'period');

    // 站內信用卡直刷（幕後授權）
    if (checkoutMode === 'card') {
      const card = normalizeCard(body.card);
      if (!card) {
        return NextResponse.json(
          { error: '請完整填寫信用卡卡號、有效期限與安全碼' },
          { status: 400 }
        );
      }

      const auth = await authorizeCreditCard({
        merOrderNo,
        payerEmail: email,
        card,
      });

      if (!auth.success) {
        return NextResponse.json(
          {
            error: auth.message || '信用卡授權失敗',
            respondCode: auth.respondCode,
            paymentConfigured: true,
            mode: 'newebpay',
          },
          { status: 402 }
        );
      }

      const writer = admin;
      if (!writer) {
        return NextResponse.json(
          { error: '付款成功但缺少 SERVICE_ROLE，無法寫入訂閱' },
          { status: 500 }
        );
      }

      const result = await upsertActiveSubscription(writer, {
        userId: user.id,
        provider: 'newebpay',
        providerRef: auth.tradeNo || merOrderNo,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || '開通失敗' }, { status: 500 });
      }

      return NextResponse.json({
        mode: 'newebpay',
        paymentConfigured: true,
        activated: true,
        method: 'card',
        subscription: result.row,
        amount: STUDENT_PASS_PRICE_TWD,
        merchantOrderNo: merOrderNo,
        tradeNo: auth.tradeNo,
      });
    }

    // 定期定額（Form Post 至藍新付款頁，首期立即授權）
    const { action, fields } = buildPeriodCheckout({
      merOrderNo,
      payerEmail: email,
      userId: user.id,
    });

    return NextResponse.json({
      mode: 'newebpay',
      paymentConfigured: true,
      method: 'period',
      action,
      fields,
      merchantOrderNo: merOrderNo,
      amount: STUDENT_PASS_PRICE_TWD,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '結帳失敗';
    console.error('⚠️ /api/checkout:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** GET：金流設定狀態（前端決定演示／信用卡表單） */
export async function GET() {
  const newebpay = isNewebpayConfigured();
  return NextResponse.json({
    paymentConfigured: newebpay,
    providers: {
      newebpay,
      demo: !newebpay || process.env.ALLOW_DEMO_CHECKOUT === 'true',
    },
    amount: STUDENT_PASS_PRICE_TWD,
    supportsCardForm: newebpay,
  });
}
