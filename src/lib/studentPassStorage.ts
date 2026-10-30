/**
 * Superprof 式 Student Pass（學生通行證）訂閱狀態
 * MVP：以 LocalStorage 模擬月費訂閱，依使用者 UID 分 key
 */

const STORAGE_PREFIX = 'idaltu_student_pass';
const GUEST_KEY = `${STORAGE_PREFIX}__guest`;

export interface StudentPassState {
  active: boolean;
  /** ISO 到期日；active 為 true 時有效 */
  expiresAt: string | null;
  planLabel: string;
  activatedAt: string | null;
}

const INACTIVE: StudentPassState = {
  active: false,
  expiresAt: null,
  planLabel: 'Student Pass',
  activatedAt: null,
};

function storageKey(userId?: string | null): string {
  if (userId && userId.trim()) return `${STORAGE_PREFIX}__${userId}`;
  return GUEST_KEY;
}

function normalize(raw: unknown): StudentPassState {
  if (!raw || typeof raw !== 'object') return { ...INACTIVE };
  const obj = raw as Record<string, unknown>;
  const expiresAt = typeof obj.expiresAt === 'string' ? obj.expiresAt : null;
  const activeFlag = Boolean(obj.active);
  const stillValid =
    activeFlag && expiresAt != null && new Date(expiresAt).getTime() > Date.now();

  return {
    active: stillValid,
    expiresAt: stillValid ? expiresAt : null,
    planLabel: typeof obj.planLabel === 'string' ? obj.planLabel : 'Student Pass',
    activatedAt: typeof obj.activatedAt === 'string' ? obj.activatedAt : null,
  };
}

export function readStudentPass(userId?: string | null): StudentPassState {
  if (typeof window === 'undefined') return { ...INACTIVE };
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return { ...INACTIVE };
    const state = normalize(JSON.parse(raw));
    // 過期則清掉 active 旗標
    if (!state.active && raw.includes('"active":true')) {
      writeStudentPass(state, userId);
    }
    return state;
  } catch {
    return { ...INACTIVE };
  }
}

export function writeStudentPass(
  state: StudentPassState,
  userId?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch (err) {
    console.warn('⚠️ 寫入 Student Pass 失敗:', err);
  }
}

/** 模擬開通一個月 Student Pass */
export function activateStudentPass(
  userId?: string | null,
  months: number = 1
): StudentPassState {
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + months);

  const state: StudentPassState = {
    active: true,
    expiresAt: expires.toISOString(),
    planLabel: 'Student Pass 月費',
    activatedAt: now.toISOString(),
  };
  writeStudentPass(state, userId);
  return state;
}

export function deactivateStudentPass(userId?: string | null): StudentPassState {
  const state = { ...INACTIVE };
  writeStudentPass(state, userId);
  return state;
}

export function formatPassExpiry(expiresAt: string | null): string {
  if (!expiresAt) return '';
  try {
    return new Date(expiresAt).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
