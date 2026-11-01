import type { MainCategoryKey } from '@/types/mainCategory';

export interface PopularTagItem {
  tag: string;
  count: number;
}

export interface PopularTagsResult {
  tags: PopularTagItem[];
  /** category | site | empty */
  source: 'category' | 'site' | 'empty';
  /** 該大類原始回傳數（回退前） */
  categoryCount: number;
}

/** 少於此數視為「過少」，回退全站或隱藏 */
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
  const data = (await res.json()) as { tags?: PopularTagItem[] };
  return Array.isArray(data.tags) ? data.tags.filter((t) => t?.tag) : [];
}

/**
 * Steam 式熱門標籤：
 * - 有 main_category：先取該類；若 < threshold 則回退全站
 * - 全站仍空：source=empty（UI 可隱藏列）
 */
export async function fetchPopularTagsWithFallback(
  mainCategory: MainCategoryKey | '' | null,
  options?: {
    signal?: AbortSignal;
    threshold?: number;
  }
): Promise<PopularTagsResult> {
  const threshold = options?.threshold ?? POPULAR_TAGS_FALLBACK_THRESHOLD;
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
  if (categoryTags.length >= threshold) {
    return {
      tags: categoryTags,
      source: 'category',
      categoryCount: categoryTags.length,
    };
  }

  const site = await fetchOnce('', signal);
  if (site.length > 0) {
    return {
      tags: site,
      source: 'site',
      categoryCount: categoryTags.length,
    };
  }

  return {
    tags: categoryTags,
    source: categoryTags.length > 0 ? 'category' : 'empty',
    categoryCount: categoryTags.length,
  };
}
