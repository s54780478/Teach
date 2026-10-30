import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import {
  getAppBaseUrl,
  STUDENT_PASS_PRICE_TWD,
} from '@/lib/payments/config';

/** 藍新環境：測試 ccore／正式 core */
export function getNewebpayHost(): string {
  const stage = (process.env.NEWEB_STAGE || process.env.NEWEBPAY_STAGE || 'test').toLowerCase();
  if (stage === 'production' || stage === 'prod') {
    return 'https://core.newebpay.com';
  }
  return 'https://ccore.newebpay.com';
}

export function getNewebpayCredentials() {
  const MerchantID = (
    process.env.NEWEB_MERCHANT_ID ||
    process.env.NEWEBPAY_MERCHANT_ID ||
    ''
  ).trim();
  const HashKey = (
    process.env.NEWEB_HASH_KEY ||
    process.env.NEWEBPAY_HASH_KEY ||
    ''
  ).trim();
  const HashIV = (
    process.env.NEWEB_HASH_IV ||
    process.env.NEWEBPAY_HASH_IV ||
    ''
  ).trim();
  return { MerchantID, HashKey, HashIV };
}

/** Query string（PHP http_build_query 近似：空格為 +） */
export function buildQueryString(params: Record<string, string | number>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v)).replace(/%20/g, '+')}`
    )
    .join('&');
}

/** AES-256-CBC → hex（PostData_ / TradeInfo / Period） */
export function aesEncryptHex(plain: string, hashKey: string, hashIv: string): string {
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(hashKey, 'utf8'), Buffer.from(hashIv, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return encrypted.toString('hex');
}

/** hex → AES-256-CBC 解密（Notify Period / TradeInfo） */
export function aesDecryptHex(hex: string, hashKey: string, hashIv: string): string {
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(hashKey, 'utf8'),
    Buffer.from(hashIv, 'utf8')
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/** MPG TradeSha：HashKey=…&…&HashIV=… → SHA256 大寫 */
export function buildTradeSha(tradeInfoHex: string, hashKey: string, hashIv: string): string {
  const raw = `HashKey=${hashKey}&${tradeInfoHex}&HashIV=${hashIv}`;
  return createHash('sha256').update(raw).digest('hex').toUpperCase();
}

/**
 * CheckCode（授權／查詢回傳驗證）
 * HashIV=…&Amt=…&MerchantID=…&MerchantOrderNo=…&TradeNo=…&HashKey=… → SHA256 大寫
 */
export function buildCheckCode(input: {
  Amt: string | number;
  MerchantID: string;
  MerchantOrderNo: string;
  TradeNo: string;
  HashKey: string;
  HashIV: string;
}): string {
  const pairs = [
    `Amt=${input.Amt}`,
    `MerchantID=${input.MerchantID}`,
    `MerchantOrderNo=${input.MerchantOrderNo}`,
    `TradeNo=${input.TradeNo}`,
  ].sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
  const raw = `HashIV=${input.HashIV}&${pairs.join('&')}&HashKey=${input.HashKey}`;
  return createHash('sha256').update(raw).digest('hex').toUpperCase();
}

export function verifyCheckCode(
  input: {
    Amt: string | number;
    MerchantID: string;
    MerchantOrderNo: string;
    TradeNo: string;
    CheckCode?: string;
  },
  hashKey: string,
  hashIv: string
): boolean {
  if (!input.CheckCode) return false;
  const expected = buildCheckCode({
    Amt: input.Amt,
    MerchantID: input.MerchantID,
    MerchantOrderNo: input.MerchantOrderNo,
    TradeNo: input.TradeNo,
    HashKey: hashKey,
    HashIV: hashIv,
  });
  return expected === input.CheckCode.toUpperCase();
}

export function createMerchantOrderNo(prefix = 'SP'): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${stamp}${rand}`.slice(0, 30);
}

function periodPointForToday(): string {
  const d = new Date().getDate();
  return String(Math.min(Math.max(d, 1), 28)).padStart(2, '0');
}

/** 定期定額建立委託（Form Post → 藍新頁面或帶卡號亦可由商店頁收集後送） */
export function buildPeriodCheckout(input: {
  merOrderNo: string;
  payerEmail: string;
  userId: string;
  periodTimes?: number;
}): { action: string; fields: Record<string, string> } {
  const { MerchantID, HashKey, HashIV } = getNewebpayCredentials();
  const base = getAppBaseUrl();

  const payload: Record<string, string | number> = {
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: '1.5',
    LangType: 'zh-Tw',
    MerOrderNo: input.merOrderNo,
    ProdDesc: 'idaltu Student Pass 月費',
    PeriodAmt: STUDENT_PASS_PRICE_TWD,
    PeriodType: 'M',
    PeriodPoint: periodPointForToday(),
    /** 2 = 立即執行委託金額授權（首期直刷） */
    PeriodStartType: 2,
    PeriodTimes: input.periodTimes ?? 12,
    PayerEmail: input.payerEmail,
    PaymentInfo: 'N',
    OrderInfo: 'N',
    EmailModify: 0,
    ReturnURL: `${base}/pay/success?provider=newebpay`,
    NotifyURL: `${base}/api/pay/callback?provider=newebpay`,
    BackURL: `${base}/pay/cancel`,
    PeriodMemo: input.userId,
  };

  const query = buildQueryString(payload);
  const PostData_ = aesEncryptHex(query, HashKey, HashIV);

  return {
    action: `${getNewebpayHost()}/MPG/period`,
    fields: {
      MerchantID_: MerchantID,
      PostData_,
    },
  };
}

export interface NewebpayCardInput {
  cardNo: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}

/** Exp：YYMM（例 2508） */
export function formatCardExp(expMonth: string, expYear: string): string {
  const mm = expMonth.replace(/\D/g, '').padStart(2, '0').slice(-2);
  let yy = expYear.replace(/\D/g, '');
  if (yy.length === 4) yy = yy.slice(-2);
  yy = yy.padStart(2, '0').slice(-2);
  return `${yy}${mm}`;
}

/**
 * 信用卡幕後授權（站內直刷）
 * POST /API/CreditCard
 */
export async function authorizeCreditCard(input: {
  merOrderNo: string;
  payerEmail: string;
  card: NewebpayCardInput;
  amt?: number;
}): Promise<{
  success: boolean;
  status?: string;
  message?: string;
  tradeNo?: string;
  merchantOrderNo?: string;
  respondCode?: string;
  checkCodeOk?: boolean;
  raw?: unknown;
}> {
  const { MerchantID, HashKey, HashIV } = getNewebpayCredentials();
  const amt = input.amt ?? STUDENT_PASS_PRICE_TWD;
  const base = getAppBaseUrl();

  const cardNo = input.card.cardNo.replace(/\s+/g, '');
  const exp = formatCardExp(input.card.expMonth, input.card.expYear);
  const cvc = input.card.cvc.replace(/\D/g, '');

  const payload: Record<string, string | number> = {
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000),
    Version: '1.1',
    MerchantOrderNo: input.merOrderNo,
    Amt: amt,
    ProdDesc: 'idaltu Student Pass',
    PayerEmail: input.payerEmail,
    CardNo: cardNo,
    Exp: exp,
    CVC: cvc,
    /** 0 = 不走 3D（若商店強制 3D 會失敗，可改 1） */
    P3D: process.env.NEWEB_P3D === '1' ? 1 : 0,
    NotifyURL: `${base}/api/pay/callback?provider=newebpay`,
    ReturnURL: `${base}/pay/success?provider=newebpay`,
  };

  const PostData_ = aesEncryptHex(buildQueryString(payload), HashKey, HashIV);
  const body = new URLSearchParams({
    MerchantID_: MerchantID,
    PostData_,
  });

  // 標準幕後授權端點（部分環境為 /API/CreditCard）
  const endpoint =
    process.env.NEWEB_CREDIT_PATH?.trim() || '/API/CreditCard/Authorize';
  const res = await fetch(`${getNewebpayHost()}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  let json: {
    Status?: string;
    Message?: string;
    Result?: Record<string, string | number>;
  };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    return { success: false, message: text.slice(0, 200) || '藍新回應無法解析' };
  }

  const result = json.Result || {};
  const respondCode = String(result.RespondCode ?? '');
  const tradeNo = String(result.TradeNo ?? '');
  const merchantOrderNo = String(result.MerchantOrderNo ?? input.merOrderNo);
  const checkCodeOk = verifyCheckCode(
    {
      Amt: result.Amt ?? amt,
      MerchantID: String(result.MerchantID ?? MerchantID),
      MerchantOrderNo: merchantOrderNo,
      TradeNo: tradeNo,
      CheckCode: result.CheckCode ? String(result.CheckCode) : undefined,
    },
    HashKey,
    HashIV
  );

  const success =
    json.Status === 'SUCCESS' &&
    (respondCode === '00' || respondCode === '') &&
    Boolean(tradeNo);

  return {
    success: success && (checkCodeOk || !result.CheckCode),
    status: json.Status,
    message: json.Message,
    tradeNo,
    merchantOrderNo,
    respondCode,
    checkCodeOk,
    raw: json,
  };
}

/** 解析 Notify：Period=hex 或 TradeInfo=hex */
export function decryptNewebpayNotify(
  encrypted: string,
  hashKey: string,
  hashIv: string
): Record<string, unknown> {
  const plain = aesDecryptHex(encrypted, hashKey, hashIv);
  // JSON
  if (plain.trim().startsWith('{')) {
    return JSON.parse(plain) as Record<string, unknown>;
  }
  // query string
  const out: Record<string, unknown> = {};
  for (const part of plain.split('&')) {
    const [k, ...rest] = part.split('=');
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(rest.join('=').replace(/\+/g, ' '));
  }
  // 若內層還有 Period JSON 字串
  if (typeof out.Period === 'string' && out.Period.startsWith('{')) {
    try {
      return JSON.parse(out.Period) as Record<string, unknown>;
    } catch {
      /* keep flat */
    }
  }
  return out;
}

export function extractUserIdFromPeriodMemo(memo: unknown): string | null {
  if (typeof memo !== 'string') return null;
  const m = memo.trim();
  // UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(m)) {
    return m;
  }
  return m.length >= 10 ? m : null;
}
