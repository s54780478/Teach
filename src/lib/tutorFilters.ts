import type { Tutor } from '@/types/tutor';

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
