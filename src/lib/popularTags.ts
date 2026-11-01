import type { MainCategoryKey } from '@/types/mainCategory';
import { isMainCategoryKey } from '@/types/mainCategory';
import { resolveMainCategory } from '@/data/mainCategories';
import { normalizeTagInput } from '@/lib/tagNormalize';
import { matchesExtraBlocklist } from '@/lib/tagBlocklistShared';
import type { Tutor } from '@/types/tutor';
import { MOCK_TUTORS } from '@/data/mockTutors';

/** Steam 式：低於此次數不進選單（避免孤立／誤填標籤） */
export const POPULAR_TAG_MIN_COUNT = 2;
/** 單次最多回傳幾顆 */
export const POPULAR_TAG_DEFAULT_LIMIT = 24;

export interface PopularTag {
  tag: string;
  count: number;
}

function tagKey(raw: string): string | null {
  const n = normalizeTagInput(raw);
  if (!n.ok || !n.name) return null;
  if (matchesExtraBlocklist(n.displayName) || matchesExtraBlocklist(n.name)) {
    return null;
  }
  return n.name;
}

/** 與列表相同：示範導師 + 真實 UUID 合併後再聚合 */
export function mergeTutorsForTagAgg(dbTutors: Tutor[]): Tutor[] {
  const real = dbTutors.filter((t) => !/^tutor-\d+$/.test(t.id));
  const byId = new Map<string, Tutor>();
  for (const t of MOCK_TUTORS) byId.set(t.id, t);
  for (const t of real) byId.set(t.id, t);
  return Array.from(byId.values());
}

/**
 * 從導師列表聚合 specialtyTags 頻率（Steam 式動態子標籤）
 */
export function aggregatePopularTags(
  tutors: Tutor[],
  options: {
    mainCategory?: MainCategoryKey | '' | null;
    limit?: number;
    minCount?: number;
  } = {}
): PopularTag[] {
  const limit = Math.min(50, Math.max(1, options.limit ?? POPULAR_TAG_DEFAULT_LIMIT));
  const minCount = Math.max(1, options.minCount ?? POPULAR_TAG_MIN_COUNT);
  const category =
    options.mainCategory && isMainCategoryKey(options.mainCategory)
      ? options.mainCategory
      : null;

  const scoped = category
    ? tutors.filter((t) => {
        const key = resolveMainCategory({
          mainCategory: t.mainCategory,
          categoryId: t.categoryId,
          subjectCategory: t.subjectCategory,
        });
        return key === category;
      })
    : tutors;

  /** key → { count, bestDisplay, displayVotes } */
  const map = new Map<
    string,
    { count: number; displays: Map<string, number> }
  >();

  for (const tutor of scoped) {
    const seenInTutor = new Set<string>();
    for (const raw of tutor.specialtyTags || []) {
      const key = tagKey(raw);
      if (!key || seenInTutor.has(key)) continue;
      seenInTutor.add(key);
      const display = normalizeTagInput(raw).displayName || raw.trim();
      const entry = map.get(key) || { count: 0, displays: new Map() };
      entry.count += 1;
      entry.displays.set(display, (entry.displays.get(display) || 0) + 1);
      map.set(key, entry);
    }
  }

  // 樣本少時放寬門檻，避免大類幾乎無 pill
  const effectiveMin =
    scoped.length > 0 && scoped.length < 6 ? Math.min(minCount, 1) : minCount;

  const rows: PopularTag[] = [];
  for (const [, entry] of map) {
    if (entry.count < effectiveMin) continue;
    let best = '';
    let bestVotes = -1;
    for (const [d, votes] of entry.displays) {
      if (votes > bestVotes || (votes === bestVotes && d.length < best.length)) {
        best = d;
        bestVotes = votes;
      }
    }
    rows.push({ tag: best, count: entry.count });
  }

  rows.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hant'));
  return rows.slice(0, limit);
}

/** 無 DB 時用示範導師聚合 */
export function aggregatePopularTagsFromMock(
  options: {
    mainCategory?: MainCategoryKey | '' | null;
    limit?: number;
    minCount?: number;
  } = {}
): PopularTag[] {
  return aggregatePopularTags(MOCK_TUTORS, {
    ...options,
    // mock 人數有限，門檻 1 才看得到動態感
    minCount: options.minCount ?? 1,
  });
}
