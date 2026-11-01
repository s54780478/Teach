import { Filter } from 'bad-words';
import type { TagNormalizeResult } from '@/lib/tagNormalize';
import { normalizeTagInput } from '@/lib/tagNormalize';
import { EXTRA_TAG_BLOCKLIST, matchesExtraBlocklist } from '@/lib/tagBlocklistShared';

/**
 * 開源 bad-words（英文）+ 在地補充黑名單
 * 注意：含 Node 套件，請勿從 Client Component 直接 import；
 * 客戶端請用 validateTagForCreateClient。
 */
let filterSingleton: Filter | null = null;

function getFilter(): Filter {
  if (!filterSingleton) {
    filterSingleton = new Filter();
    filterSingleton.addWords(...EXTRA_TAG_BLOCKLIST);
  }
  return filterSingleton;
}

export function isBlockedTag(nameOrRaw: string): boolean {
  const norm = normalizeTagInput(nameOrRaw);
  const candidates = [nameOrRaw, norm.name, norm.displayName]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const filter = getFilter();
  for (const c of candidates) {
    if (filter.isProfane(c)) return true;
    if (matchesExtraBlocklist(c)) return true;
  }
  return false;
}

export function validateTagForCreate(raw: string): TagNormalizeResult & { blocked?: boolean } {
  const result = normalizeTagInput(raw);
  if (!result.ok) return result;

  if (isBlockedTag(result.name) || isBlockedTag(result.displayName)) {
    return {
      ok: false,
      name: result.name,
      displayName: result.displayName,
      code: 'blocked',
      blocked: true,
      message: '此標籤含有不適當內容，無法建立',
    };
  }

  return result;
}
