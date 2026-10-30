import { createHmac, timingSafeEqual } from 'crypto';
import {
  getAppBaseUrl,
  STUDENT_PASS_PRICE_CENTS,
  STUDENT_PASS_PLAN,
} from '@/lib/payments/config';

export async function createStripeCheckoutSession(input: {
  userId: string;
  email?: string | null;
}): Promise<{ id: string; url: string }> {
  const secret = process.env.STRIPE_SECRET_KEY!.trim();
  const base = getAppBaseUrl();

  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set(
    'success_url',
    `${base}/pay/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`
  );
  body.set('cancel_url', `${base}/pay/cancel`);
  body.set('client_reference_id', input.userId);
  body.set('metadata[user_id]', input.userId);
  body.set('metadata[plan]', STUDENT_PASS_PLAN);
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', 'twd');
  body.set(
    'line_items[0][price_data][unit_amount]',
    String(STUDENT_PASS_PRICE_CENTS)
  );
  body.set('line_items[0][price_data][product_data][name]', 'idaltu Student Pass');
  body.set(
    'line_items[0][price_data][product_data][description]',
    '月費通行證 · 無限次聯繫全台導師'
  );
  if (input.email) body.set('customer_email', input.email);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(data.error?.message || '建立 Stripe Checkout 失敗');
  }
  return { id: data.id, url: data.url };
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<{
  id: string;
  payment_status: string;
  client_reference_id: string | null;
  metadata: Record<string, string>;
}> {
  const secret = process.env.STRIPE_SECRET_KEY!.trim();
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    { headers: { Authorization: `Bearer ${secret}` } }
  );
  const data = (await res.json()) as {
    id?: string;
    payment_status?: string;
    client_reference_id?: string | null;
    metadata?: Record<string, string>;
    error?: { message?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || '讀取 Stripe Session 失敗');
  }
  return {
    id: data.id,
    payment_status: data.payment_status || 'unpaid',
    client_reference_id: data.client_reference_id ?? null,
    metadata: data.metadata || {},
  };
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((p) => {
        const [k, v] = p.split('=');
        return [k.trim(), v?.trim() || ''];
      })
    );
    const timestamp = parts.t;
    const v1 = parts.v1;
    if (!timestamp || !v1) return false;

    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;

    const payload = `${timestamp}.${rawBody}`;
    const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(v1, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
