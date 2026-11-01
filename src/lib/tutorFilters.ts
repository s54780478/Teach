import type { TeachingMode, Tutor } from '@/types/tutor';
import {
  teachingModeLabels,
  teachingModeShortFromModes,
  modesFromLegacyMode,
} from '@/lib/teachingModes';
import { resolveCategoryId, tutorBelongsToCategory } from '@/data/taxonomySeed';
import { resolveMainCategory } from '@/data/mainCategories';
import type { MainCategoryKey } from '@/types/mainCategory';
import { toTagSlug } from '@/lib/tagSlug';

/** 科目／關鍵字：優先比對 tags（含英文 slug），其次標題／姓名 */
export function tutorMatchesKeyword(tutor: Tutor, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  if (
    tutor.specialtyTags.some((t) => {
      const lower = t.toLowerCase();
      if (lower.includes(q)) return true;
      // URL 英文 slug（piano）也能命中「鋼琴」
      return toTagSlug(t) === q;
    })
  ) {
    return true;
  }
  const blob = [tutor.name, tutor.headline, tutor.bio, tutor.subjectCategory, tutor.verification.degree]
    .join(' ')
    .toLowerCase();
  return blob.includes(q);
}

export function tutorMatchesMainCategory(
  tutor: Tutor,
  mainCategory: MainCategoryKey | 'all' | string
): boolean {
  if (!mainCategory || mainCategory === 'all') return true;
  const resolved = resolveMainCategory({
    mainCategory: tutor.mainCategory,
    categoryId: tutor.categoryId,
    subjectCategory: tutor.subjectCategory,
  });
  return resolved === mainCategory;
}

/** Superprof 式回覆時間文案 */
export function formatResponseLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return '回覆迅速';
  if (minutes <= 30) return `通常在 ${minutes} 分鐘內回覆`;
  if (minutes <= 60) return '通常在 1 小時內回覆';
  if (minutes <= 180) return '通常在數小時內回覆';
  const hours = Math.round(minutes / 60);
  return `平均約 ${hours} 小時回覆`;
}

/** 授課方式標籤（優先 teachingModes） */
export function teachingModeTags(
  mode: TeachingMode,
  teachingModes?: Tutor['teachingModes']
): string[] {
  const modes =
    teachingModes && teachingModes.length > 0
      ? teachingModes
      : modesFromLegacyMode(mode);
  return teachingModeLabels(modes);
}

export function teachingModeShortLabel(
  mode: TeachingMode,
  teachingModes?: Tutor['teachingModes']
): string {
  const modes =
    teachingModes && teachingModes.length > 0
      ? teachingModes
      : modesFromLegacyMode(mode);
  return teachingModeShortFromModes(modes);
}

/** 目錄中有命中老師的科目關鍵字（用於隱藏空分類） */
export function collectAvailableSubjectQueries(
  tutors: Tutor[],
  queries: readonly string[]
): Set<string> {
  const available = new Set<string>();
  for (const q of queries) {
    if (tutors.some((t) => tutorMatchesKeyword(t, q))) {
      available.add(q);
    }
  }
  return available;
}

/** 目錄中實際存在的一級分類 key */
export function collectAvailableCategories(tutors: Tutor[]): Set<string> {
  return new Set(
    tutors.map((t) =>
      resolveMainCategory({
        mainCategory: t.mainCategory,
        categoryId: t.categoryId,
        subjectCategory: t.subjectCategory,
      })
    )
  );
}

export { tutorBelongsToCategory };

/** 依地區／科目關鍵字過濾導師（首頁與 SEO 分類頁共用） */
export function filterTutorsByRegionSubject(
  tutors: Tutor[],
  regionQuery: string,
  subjectQuery: string
): Tutor[] {
  const region = regionQuery.trim().toLowerCase();
  const subject = subjectQuery.trim().toLowerCase();

  return tutors.filter((tutor) => {
    if (region) {
      const city = tutor.location.city.toLowerCase();
      const district = tutor.location.district.toLowerCase();
      const display = tutor.location.displayLocation.toLowerCase();
      const regionShort = region.replace(/(市|縣)$/, '');
      const match =
        city.includes(region) ||
        city.includes(regionShort) ||
        district.includes(region) ||
        display.includes(region) ||
        display.includes(regionShort);
      if (!match) return false;
    }

    if (subject && !tutorMatchesKeyword(tutor, subject)) {
      const matchCatId =
        tutor.categoryId === subject ||
        tutor.mainCategory === subject ||
        resolveCategoryId(tutor.subjectCategory) === subject;
      if (!matchCatId) return false;
    }

    return true;
  });
}
