import type { MainCategoryKey } from '@/types/mainCategory';
import { isMainCategoryKey } from '@/types/mainCategory';

export interface PopularTagItem {
  tag: string;
  count: number;
  /** 全站熱門時帶所屬大類，點擊可導向 `/tutors/{main}/{slug}` */
  mainCategory?: MainCategoryKey;
}

export interface PopularTagsResult {
  tags: PopularTagItem[];
  /** category | site | empty */
  source: 'category' | 'site' | 'empty';
  /** 該大類原始回傳數（回退前） */
  categoryCount: number;
}

/** @deprecated 已不再回退全站 tags；保留常數以免舊引用炸掉 */
export const POPULAR_TAGS_FALLBACK_THRESHOLD = 4;

async function fetchOnce(
  mainCategory: MainCategoryKey | '' | null,
  signal?: AbortSignal
): Promise<PopularTagItem[]> {
  const qs = new URLSearchParams();
  qs.set('limit', '24');
  if (mainCategory) qs.set('main_category', mainCategory);
  const res = await fetch(`/api/tags/popular?${qs.toString()}`, { signal });
  if (!res.ok) throw new Error('popular tags failed');
  const data = (await res.json()) as {
    tags?: Array<{ tag?: string; count?: number; mainCategory?: string }>;
  };
  if (!Array.isArray(data.tags)) return [];
  return data.tags
    .filter((t) => t?.tag)
    .map((t) => ({
      tag: String(t.tag),
      count: Number(t.count) || 0,
      ...(t.mainCategory && isMainCategoryKey(t.mainCategory)
        ? { mainCategory: t.mainCategory }
        : {}),
    }));
}

/**
 * Steam 式熱門標籤：
 * - 有選大類：只顯示該類 tags（絕不回退全站，避免「個人成長 + 國中數學」篩成 0 筆）
 * - 未選大類：全站熱門
 */
export async function fetchPopularTagsWithFallback(
  mainCategory: MainCategoryKey | '' | null,
  options?: {
    signal?: AbortSignal;
    threshold?: number;
  }
): Promise<PopularTagsResult> {
  const signal = options?.signal;

  if (!mainCategory) {
    const site = await fetchOnce('', signal);
    return {
      tags: site,
      source: site.length > 0 ? 'site' : 'empty',
      categoryCount: site.length,
    };
  }

  const categoryTags = await fetchOnce(mainCategory, signal);
  return {
    tags: categoryTags,
    source: categoryTags.length > 0 ? 'category' : 'empty',
    categoryCount: categoryTags.length,
  };
}
