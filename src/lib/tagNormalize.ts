/** 標籤字元長度（Unicode code point）上下限 */
export const TAG_MIN_LEN = 2;
export const TAG_MAX_LEN = 20;
/** 每位導師／課程最多綁定標籤數 */
export const MAX_TAGS_PER_TUTOR = 5;
/** 進入全站公共選單的使用次數門檻 */
export const TAG_PUBLIC_USAGE_THRESHOLD = 5;
/** 累計檢舉達此次數自動 disabled */
export const TAG_REPORT_HIDE_THRESHOLD = 3;

export type TagValidationCode =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'url'
  | 'blocked';

export interface TagNormalizeResult {
  ok: boolean;
  /** 寫入 DB 的正規化鍵（NFKC + lowercase，僅字母數字與單空白） */
  name: string;
  /** 顯示用（Trim + NFKC，保留原始大小寫風格但去雜訊） */
  displayName: string;
  code?: TagValidationCode;
  message?: string;
}

const URL_RE = /https?:\/\/\S+/i;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
/** 允許字母／數字／空白；其餘視為標點過濾 */
const ALLOWED_RUN_RE = /[^\p{L}\p{N}\s]/gu;

function codePointLength(s: string): number {
  return Array.from(s).length;
}

/**
 * Trim → NFKC → 去網址／Emoji／標點 → 空白摺疊 → lowercase
 */
export function normalizeTagInput(raw: string): TagNormalizeResult {
  if (typeof raw !== 'string') {
    return { ok: false, name: '', displayName: '', code: 'empty', message: '標籤不可為空' };
  }

  if (URL_RE.test(raw)) {
    return {
      ok: false,
      name: '',
      displayName: '',
      code: 'url',
      message: '標籤不可包含網址',
    };
  }

  let s = raw.normalize('NFKC').trim();
  if (!s) {
    return { ok: false, name: '', displayName: '', code: 'empty', message: '標籤不可為空' };
  }

  if (EMOJI_RE.test(s)) {
    s = s.replace(/\p{Extended_Pictographic}/gu, '');
  }

  // 顯示名：去標點後保留大小寫
  const displayClean = s
    .replace(ALLOWED_RUN_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!displayClean) {
    return {
      ok: false,
      name: '',
      displayName: '',
      code: 'invalid_chars',
      message: '標籤僅能包含各國語言字母與數字',
    };
  }

  const name = displayClean.toLowerCase();
  const len = codePointLength(name);

  if (len < TAG_MIN_LEN) {
    return {
      ok: false,
      name,
      displayName: displayClean,
      code: 'too_short',
      message: `標籤至少 ${TAG_MIN_LEN} 個字元`,
    };
  }
  if (len > TAG_MAX_LEN) {
    return {
      ok: false,
      name,
      displayName: displayClean,
      code: 'too_long',
      message: `標籤最多 ${TAG_MAX_LEN} 個字元`,
    };
  }

  return { ok: true, name, displayName: displayClean };
}

/** 批次正規化並去重（依 name），最多 max 個 */
export function normalizeTagList(
  tags: string[],
  max = MAX_TAGS_PER_TUTOR
): { tags: { name: string; displayName: string }[]; error?: string } {
  const out: { name: string; displayName: string }[] = [];
  const seen = new Set<string>();

  for (const raw of tags) {
    const r = normalizeTagInput(raw);
    if (!r.ok) {
      return { tags: out, error: r.message || '標籤格式無效' };
    }
    if (seen.has(r.name)) continue;
    if (out.length >= max) {
      return {
        tags: out,
        error: `每位老師最多 ${max} 個標籤`,
      };
    }
    seen.add(r.name);
    out.push({ name: r.name, displayName: r.displayName });
  }

  return { tags: out };
}
