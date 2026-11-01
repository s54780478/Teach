/** 固定 8 大一級分類（不可任意擴充） */
export const MAIN_CATEGORY_KEYS = [
  'languages',
  'academic',
  'technology',
  'arts_music',
  'sports_fitness',
  'career_exams',
  'lifestyle_hobbies',
  'personal_development',
] as const;

export type MainCategoryKey = (typeof MAIN_CATEGORY_KEYS)[number];

export function isMainCategoryKey(value: unknown): value is MainCategoryKey {
  return (
    typeof value === 'string' &&
    (MAIN_CATEGORY_KEYS as readonly string[]).includes(value)
  );
}
