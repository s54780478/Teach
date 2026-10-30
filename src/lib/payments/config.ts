export type PaymentProvider = 'newebpay' | 'demo';

export const STUDENT_PASS_PRICE_TWD = 499;
export const STUDENT_PASS_PRICE_CENTS = STUDENT_PASS_PRICE_TWD * 100;
export const STUDENT_PASS_PLAN = 'student_pass_monthly';
export const STUDENT_PASS_MONTHS = 1;

/** 藍新金流（NewebPay）已設定商店代號與 Hash 金鑰 */
export function isNewebpayConfigured(): boolean {
  const mid = (
    process.env.NEWEB_MERCHANT_ID ||
    process.env.NEWEBPAY_MERCHANT_ID ||
    ''
  ).trim();
  const key = (
    process.env.NEWEB_HASH_KEY ||
    process.env.NEWEBPAY_HASH_KEY ||
    ''
  ).trim();
  const iv = (
    process.env.NEWEB_HASH_IV ||
    process.env.NEWEBPAY_HASH_IV ||
    ''
  ).trim();
  return Boolean(mid && key && iv);
}

export function isPaymentConfigured(): boolean {
  return isNewebpayConfigured();
}

export function resolveCheckoutProvider(
  preferred?: string | null
): PaymentProvider {
  if (preferred === 'demo') return 'demo';
  if (preferred === 'newebpay' && isNewebpayConfigured()) return 'newebpay';
  if (isNewebpayConfigured()) return 'newebpay';
  return 'demo';
}

export function getAppBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    '';
  if (fromEnv.trim()) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
