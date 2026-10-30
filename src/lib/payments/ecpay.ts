import { createHash } from 'crypto';
import {
  getAppBaseUrl,
  STUDENT_PASS_PRICE_TWD,
} from '@/lib/payments/config';

function ecpayDotNetUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

/** 綠界 CheckMacValue（SHA256） */
export function buildEcpayCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIv: string
): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== 'CheckMacValue' && params[k] !== undefined && params[k] !== '')
    .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));

  const raw = `HashKey=${hashKey}&${sorted
    .map((k) => `${k}=${params[k]}`)
    .join('&')}&HashIV=${hashIv}`;

  const encoded = ecpayDotNetUrlEncode(raw).toLowerCase();
  return createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

export function verifyEcpayCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIv: string
): boolean {
  const received = (params.CheckMacValue || '').toUpperCase();
  if (!received) return false;
  const computed = buildEcpayCheckMacValue(params, hashKey, hashIv);
  return computed === received;
}

export function getEcpayGatewayUrl(): string {
  const stage = (process.env.ECPAY_STAGE || 'test').toLowerCase();
  if (stage === 'production' || stage === 'prod') {
    return 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';
  }
  return 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';
}

export function buildEcpayCheckoutParams(input: {
  merchantTradeNo: string;
  userId: string;
  itemName?: string;
}): { action: string; fields: Record<string, string> } {
  const merchantId = process.env.ECPAY_MERCHANT_ID!.trim();
  const hashKey = process.env.ECPAY_HASH_KEY!.trim();
  const hashIv = process.env.ECPAY_HASH_IV!.trim();
  const base = getAppBaseUrl();
  const now = new Date();
  const tradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const fields: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: input.merchantTradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: String(STUDENT_PASS_PRICE_TWD),
    TradeDesc: 'idaltu Student Pass',
    ItemName: input.itemName || 'Student Pass 月費通行證',
    ReturnURL: `${base}/api/pay/callback?provider=ecpay`,
    OrderResultURL: `${base}/pay/success?provider=ecpay`,
    ClientBackURL: `${base}/pay/cancel`,
    ChoosePayment: 'ALL',
    EncryptType: '1',
    CustomField1: input.userId,
    CustomField2: 'student_pass_monthly',
  };

  fields.CheckMacValue = buildEcpayCheckMacValue(fields, hashKey, hashIv);

  return { action: getEcpayGatewayUrl(), fields };
}
