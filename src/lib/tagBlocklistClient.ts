import type { TagNormalizeResult } from '@/lib/tagNormalize';
import { normalizeTagInput } from '@/lib/tagNormalize';
import { matchesExtraBlocklist } from '@/lib/tagBlocklistShared';

/** 客戶端安全：僅用補充黑名單（完整 bad-words 在 API／伺服端） */
export function validateTagForCreateClient(
  raw: string
): TagNormalizeResult & { blocked?: boolean } {
  const result = normalizeTagInput(raw);
  if (!result.ok) return result;

  if (matchesExtraBlocklist(result.name) || matchesExtraBlocklist(result.displayName)) {
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
