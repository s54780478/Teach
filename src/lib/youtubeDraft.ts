/** 本機草稿：避免老師每次重找 YouTube 連結（以 Auth UID 區隔） */

const PREFIX = 'idaltu:tutor-youtube:';

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function readYoutubeDraft(userId: string): string {
  if (typeof window === 'undefined' || !userId) return '';
  try {
    return (window.localStorage.getItem(key(userId)) || '').trim();
  } catch {
    return '';
  }
}

export function writeYoutubeDraft(userId: string, url: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const v = url.trim();
    if (!v) {
      window.localStorage.removeItem(key(userId));
      return;
    }
    window.localStorage.setItem(key(userId), v);
  } catch {
    // ignore quota / private mode
  }
}

export function clearYoutubeDraft(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}
