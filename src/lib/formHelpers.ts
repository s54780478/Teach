/** Superprof 式表單微規則（即時過濾／欄位旁錯誤） */

export const HEADLINE_MAX = 50;
export const HOURLY_RATE_MIN = 100;

/** 電話：僅保留數字（可選保留開頭 +） */
export function digitsOnlyPhone(raw: string, allowPlus = true): string {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (!allowPlus) return cleaned.replace(/\+/g, '');
  // 只允許開頭一個 +
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\+/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/** 時薪：僅數字 */
export function digitsOnlyAmount(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function clampHeadline(raw: string, max = HEADLINE_MAX): string {
  return raw.slice(0, max);
}

export function validatePhoneOptional(phone: string): string | null {
  const t = phone.trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return '請輸入有效電話（8–15 位數字）';
  }
  return null;
}

export function validateHourlyRate(raw: string): string | null {
  const t = raw.trim();
  if (!t) return '請填寫時薪';
  const n = Number(t);
  if (!Number.isFinite(n) || n < HOURLY_RATE_MIN) {
    return `時薪需為數字且至少 ${HOURLY_RATE_MIN} 元`;
  }
  return null;
}

export function validateHeadlineRequired(raw: string): string | null {
  const t = raw.trim();
  if (!t) return '請填寫個人頭銜（一句話介紹）';
  if (t.length > HEADLINE_MAX) return `頭銜請控制在 ${HEADLINE_MAX} 字以內`;
  return null;
}
