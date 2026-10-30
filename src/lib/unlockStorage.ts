/**
 * 買方解鎖狀態 — 瀏覽器 LocalStorage 持久化
 * key 依使用者區分，登出後再登入可還原本機紀錄
 */

const STORAGE_PREFIX = 'idaltu_unlocked_ids';
const GUEST_KEY = `${STORAGE_PREFIX}__guest`;

function storageKey(userId?: string | null): string {
  if (userId && userId.trim()) return `${STORAGE_PREFIX}__${userId}`;
  return GUEST_KEY;
}

export function readUnlockedIds(userId?: string | null): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export function writeUnlockedIds(ids: string[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    window.localStorage.setItem(storageKey(userId), JSON.stringify(unique));
  } catch (err) {
    console.warn('⚠️ 寫入解鎖 LocalStorage 失敗:', err);
  }
}

/** 合併多來源 ID 並寫回 LocalStorage */
export function mergeUnlockedIds(
  sources: string[][],
  userId?: string | null
): string[] {
  const merged = Array.from(new Set(sources.flat().filter(Boolean)));
  writeUnlockedIds(merged, userId);
  return merged;
}

export function addUnlockedId(tutorId: string, userId?: string | null): string[] {
  const next = mergeUnlockedIds([readUnlockedIds(userId), [tutorId]], userId);
  return next;
}
