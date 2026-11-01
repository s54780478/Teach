import type { MainCategoryKey } from '@/types/mainCategory';
import { MAIN_CATEGORY_KEYS, isMainCategoryKey } from '@/types/mainCategory';

export interface MainCategoryDef {
  key: MainCategoryKey;
  /** 中文顯示名稱 */
  label: string;
  /** 簡短定義（產品／刊登說明用） */
  description: string;
  /** lucide icon 名稱 */
  icon: string;
  sortOrder: number;
}

/**
 * 首頁／搜尋第一層：固定 8 大分類（Enum）。
 * 細項一律走 tags，勿再新增一級分類。
 */
export const MAIN_CATEGORIES: MainCategoryDef[] = [
  {
    key: 'languages',
    label: '語言學習',
    description: '各國語言、口說、閱讀、寫作',
    icon: 'Languages',
    sortOrder: 1,
  },
  {
    key: 'academic',
    label: '學科升學',
    description: '學校學科、升學考試、學術知識',
    icon: 'GraduationCap',
    sortOrder: 2,
  },
  {
    key: 'technology',
    label: '科技程式',
    description: '程式設計、AI、資料分析、資訊科技',
    icon: 'Code2',
    sortOrder: 3,
  },
  {
    key: 'arts_music',
    label: '藝術創作',
    description: '音樂、美術、繪畫、設計、攝影、藝術創作',
    icon: 'Palette',
    sortOrder: 4,
  },
  {
    key: 'sports_fitness',
    label: '運動健身',
    description: '健身、瑜伽、舞蹈、球類、體能訓練',
    icon: 'Dumbbell',
    sortOrder: 5,
  },
  {
    key: 'career_exams',
    label: '職涯專業',
    description: '職場技能、商業管理、證照、專業檢定',
    icon: 'Briefcase',
    sortOrder: 6,
  },
  {
    key: 'lifestyle_hobbies',
    label: '生活興趣',
    description: '烹飪、烘焙、園藝、手作、旅遊等生活興趣',
    icon: 'Heart',
    sortOrder: 7,
  },
  {
    key: 'personal_development',
    label: '個人成長',
    description: '心理學、情緒管理、溝通、人際關係、時間管理、自我成長',
    icon: 'Sparkles',
    sortOrder: 8,
  },
];

export const MAIN_CATEGORY_LABEL: Record<MainCategoryKey, string> =
  Object.fromEntries(MAIN_CATEGORIES.map((c) => [c.key, c.label])) as Record<
    MainCategoryKey,
    string
  >;

/** 舊 taxonomy category_id → 新 main_category */
export const LEGACY_CATEGORY_ID_TO_MAIN: Record<string, MainCategoryKey> = {
  languages: 'languages',
  academic: 'academic',
  technology: 'technology',
  arts_music: 'arts_music',
  sports_fitness: 'sports_fitness',
  career_exams: 'career_exams',
  lifestyle_hobbies: 'lifestyle_hobbies',
  personal_development: 'personal_development',
  // 舊 id
  programming: 'technology',
  arts: 'arts_music',
  sports: 'sports_fitness',
  professional: 'career_exams',
  lifestyle: 'lifestyle_hobbies',
  others: 'personal_development',
};

/** 舊／新 subject_category 中文 → main_category */
export const LEGACY_SUBJECT_TO_MAIN: Record<string, MainCategoryKey> = {
  語言學習: 'languages',
  語言與檢定: 'languages',
  外語學習: 'languages',
  學科升學: 'academic',
  升學與學科: 'academic',
  數理升學: 'academic',
  語文寫作: 'academic',
  科技程式: 'technology',
  程式與資訊科技: 'technology',
  程式設計: 'technology',
  藝術創作: 'arts_music',
  音樂與藝術: 'arts_music',
  音樂藝術: 'arts_music',
  運動健身: 'sports_fitness',
  運動與健身: 'sports_fitness',
  體育運動: 'sports_fitness',
  職涯專業: 'career_exams',
  職涯與專業技能: 'career_exams',
  商業金融: 'career_exams',
  生活興趣: 'lifestyle_hobbies',
  '生活、陪讀與興趣': 'lifestyle_hobbies',
  個人成長: 'personal_development',
  其他與創新領域: 'personal_development',
  其他: 'personal_development',
};

export function mainCategoryLabel(key: MainCategoryKey | string): string {
  if (isMainCategoryKey(key)) return MAIN_CATEGORY_LABEL[key];
  return '生活興趣';
}

/**
 * 從 DB／舊欄位推導 main_category（寫入與顯示共用）
 */
export function resolveMainCategory(input: {
  mainCategory?: string | null;
  categoryId?: string | null;
  subjectCategory?: string | null;
}): MainCategoryKey {
  if (isMainCategoryKey(input.mainCategory)) return input.mainCategory;

  const fromId = input.categoryId
    ? LEGACY_CATEGORY_ID_TO_MAIN[input.categoryId.trim()]
    : undefined;
  if (fromId) return fromId;

  const subject = (input.subjectCategory || '').trim();
  if (subject && LEGACY_SUBJECT_TO_MAIN[subject]) {
    return LEGACY_SUBJECT_TO_MAIN[subject];
  }

  return 'lifestyle_hobbies';
}

export function getMainCategoryDef(
  key: MainCategoryKey
): MainCategoryDef | undefined {
  return MAIN_CATEGORIES.find((c) => c.key === key);
}

export { MAIN_CATEGORY_KEYS, isMainCategoryKey };
