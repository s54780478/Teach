import type { TeachingMode, Tutor } from '@/types/tutor';

/** 科目／關鍵字是否命中導師公開欄位 */
export function tutorMatchesKeyword(tutor: Tutor, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const blob = [
    tutor.name,
    tutor.headline,
    tutor.bio,
    tutor.subjectCategory,
    tutor.verification.degree,
    ...tutor.specialtyTags,
  ]
    .join(' ')
    .toLowerCase();
  return blob.includes(q);
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

/** 授課方式標籤（卡片／履歷共用） */
export function teachingModeTags(mode: TeachingMode): string[] {
  if (mode === 'online') return ['線上授課'];
  if (mode === 'in-person') return ['到府授課', '老師指定地點'];
  return ['線上授課', '到府授課'];
}

export function teachingModeShortLabel(mode: TeachingMode): string {
  if (mode === 'online') return '線上授課';
  if (mode === 'in-person') return '到府授課';
  return '線上／到府';
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

/** 目錄中實際存在的 subjectCategory id */
export function collectAvailableCategories(tutors: Tutor[]): Set<string> {
  return new Set(tutors.map((t) => t.subjectCategory).filter(Boolean));
}

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

    if (subject) {
      const matchName = tutor.name.toLowerCase().includes(subject);
      const matchCategory = tutor.subjectCategory.toLowerCase().includes(subject);
      const matchTags = tutor.specialtyTags.some((t) => t.toLowerCase().includes(subject));
      const matchHeadline = tutor.headline.toLowerCase().includes(subject);
      const matchDegree = tutor.verification.degree.toLowerCase().includes(subject);
      if (!matchName && !matchCategory && !matchTags && !matchHeadline && !matchDegree) {
        return false;
      }
    }

    return true;
  });
}
