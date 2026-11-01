import type { TaxonomyCategory, TaxonomySubcategory, TaxonomyTree } from '@/types/taxonomy';
import {
  LEGACY_CATEGORY_ID_TO_MAIN,
  LEGACY_SUBJECT_TO_MAIN,
  MAIN_CATEGORIES,
  mainCategoryLabel,
  resolveMainCategory,
} from '@/data/mainCategories';
import type { MainCategoryKey } from '@/types/mainCategory';

/**
 * 第一層＝固定 8 大 main_category（與 src/data/mainCategories 同步）。
 * 第二層建議子類＋第三層 tags；細項不擴充一級分類。
 */
export const TAXONOMY_CATEGORIES: TaxonomyCategory[] = MAIN_CATEGORIES.map(
  (c) => ({
    id: c.key,
    name: c.label,
    icon: c.icon,
    sortOrder: c.sortOrder,
  })
);

export const TAXONOMY_SUBCATEGORIES: TaxonomySubcategory[] = [
  // —— 學科升學 ——
  {
    id: 'academic-elementary',
    categoryId: 'academic',
    name: '國小全科／陪讀',
    sortOrder: 1,
    suggestedTags: ['國小數學', '國小國語', '國小英文', '作業陪讀', '一對一'],
  },
  {
    id: 'academic-junior-math',
    categoryId: 'academic',
    name: '國中數學／理化',
    sortOrder: 2,
    suggestedTags: ['國中數學', '國中理化', '會考衝刺', '會考數學'],
  },
  {
    id: 'academic-senior-math',
    categoryId: 'academic',
    name: '高中數學',
    sortOrder: 3,
    suggestedTags: ['高中數學', '學測數學', '數A', '數B', '分科數學'],
  },
  {
    id: 'academic-science',
    categoryId: 'academic',
    name: '物理／化學／生物',
    sortOrder: 4,
    suggestedTags: ['高中物理', '高中化學', '生物', '學測自然', '分科測驗'],
  },
  {
    id: 'academic-chinese',
    categoryId: 'academic',
    name: '國文／作文',
    sortOrder: 5,
    suggestedTags: ['學測國文', '作文', '文言文', '小論文', '國中國文'],
  },
  {
    id: 'academic-social',
    categoryId: 'academic',
    name: '社會／公民／地理歷史',
    sortOrder: 6,
    suggestedTags: ['學測社會', '公民', '歷史', '地理', '時事'],
  },
  {
    id: 'academic-exam',
    categoryId: 'academic',
    name: '學測／分科／會考衝刺',
    sortOrder: 7,
    suggestedTags: ['學測衝刺', '分科測驗', '會考衝刺', '模考解題'],
  },

  // —— 語言學習 ——
  {
    id: 'lang-english',
    categoryId: 'languages',
    name: '英文／英語',
    sortOrder: 1,
    suggestedTags: ['英文會話', '學測英文', '高中英文', '英文作文', '聽力'],
  },
  {
    id: 'lang-ielts-toefl',
    categoryId: 'languages',
    name: '雅思／托福／多益',
    sortOrder: 2,
    suggestedTags: ['雅思', '托福', '多益', '雅思口說', '商務英文'],
  },
  {
    id: 'lang-japanese',
    categoryId: 'languages',
    name: '日文',
    sortOrder: 3,
    suggestedTags: ['日文會話', 'JLPT', 'N2', 'N1', '日文檢定'],
  },
  {
    id: 'lang-korean',
    categoryId: 'languages',
    name: '韓文',
    sortOrder: 4,
    suggestedTags: ['韓文會話', 'TOPIK', '韓文檢定'],
  },
  {
    id: 'lang-chinese',
    categoryId: 'languages',
    name: '華語／中文外師',
    sortOrder: 5,
    suggestedTags: ['華語教學', 'TOCFL', '中文會話'],
  },
  {
    id: 'lang-other',
    categoryId: 'languages',
    name: '其他外語',
    sortOrder: 6,
    suggestedTags: ['西班牙文', '法文', '德文', '越南文'],
  },

  // —— 科技程式 ——
  {
    id: 'prog-web',
    categoryId: 'technology',
    name: '網頁／前端',
    sortOrder: 1,
    suggestedTags: ['React', 'Next.js', 'HTML/CSS', 'JavaScript', '作品集'],
  },
  {
    id: 'prog-python',
    categoryId: 'technology',
    name: 'Python／資料科學',
    sortOrder: 2,
    suggestedTags: ['Python 入門', '資料分析', '機器學習', '爬蟲'],
  },
  {
    id: 'prog-app',
    categoryId: 'technology',
    name: 'App／後端',
    sortOrder: 3,
    suggestedTags: ['Flutter', 'Swift', 'Node.js', 'SQL'],
  },
  {
    id: 'prog-kids',
    categoryId: 'technology',
    name: '兒童程式／創客',
    sortOrder: 4,
    suggestedTags: ['Scratch', 'Minecraft 程式', 'Arduino', '機器人'],
  },
  {
    id: 'prog-ai',
    categoryId: 'technology',
    name: 'AI／自動化',
    sortOrder: 5,
    suggestedTags: ['ChatGPT 應用', 'AI 繪圖', '自動化腳本', 'Prompt'],
  },

  // —— 藝術創作 ——
  {
    id: 'arts-piano',
    categoryId: 'arts_music',
    name: '鋼琴／鍵盤',
    sortOrder: 1,
    suggestedTags: ['鋼琴', '流行伴奏', '古典鋼琴', '檢定'],
  },
  {
    id: 'arts-guitar',
    categoryId: 'arts_music',
    name: '吉他／烏克麗麗',
    sortOrder: 2,
    suggestedTags: ['吉他', '烏克麗麗', '自彈自唱', 'Fingerstyle'],
  },
  {
    id: 'arts-vocal',
    categoryId: 'arts_music',
    name: '歌唱／聲樂',
    sortOrder: 3,
    suggestedTags: ['唱歌', '流行歌唱', '發聲', 'VTuber 聲優'],
  },
  {
    id: 'arts-visual',
    categoryId: 'arts_music',
    name: '美術／插畫／設計',
    sortOrder: 4,
    suggestedTags: ['素描', '插畫', '水彩', '作品集', '平面設計'],
  },
  {
    id: 'arts-photo',
    categoryId: 'arts_music',
    name: '攝影／影像',
    sortOrder: 5,
    suggestedTags: ['攝影', '人像攝影', '剪輯', '影像創作'],
  },
  {
    id: 'arts-other',
    categoryId: 'arts_music',
    name: '其他樂器／表演',
    sortOrder: 6,
    suggestedTags: ['小提琴', '鼓', '長笛', '舞蹈'],
  },

  // —— 運動健身 ——
  {
    id: 'sports-fitness',
    categoryId: 'sports_fitness',
    name: '健身／重訓',
    sortOrder: 1,
    suggestedTags: ['重訓', '減脂', '增肌', '居家健身'],
  },
  {
    id: 'sports-yoga',
    categoryId: 'sports_fitness',
    name: '瑜珈／皮拉提斯',
    sortOrder: 2,
    suggestedTags: ['瑜珈', '皮拉提斯', '伸展'],
  },
  {
    id: 'sports-dance',
    categoryId: 'sports_fitness',
    name: '舞蹈／有氧',
    sortOrder: 3,
    suggestedTags: ['舞蹈', '有氧', '街舞', '拉丁舞'],
  },
  {
    id: 'sports-ball',
    categoryId: 'sports_fitness',
    name: '球類',
    sortOrder: 4,
    suggestedTags: ['羽球', '籃球', '網球', '游泳'],
  },
  {
    id: 'sports-martial',
    categoryId: 'sports_fitness',
    name: '武術／自衛',
    sortOrder: 5,
    suggestedTags: ['跆拳道', '柔道', '拳擊', '自衛術'],
  },
  {
    id: 'sports-kids',
    categoryId: 'sports_fitness',
    name: '兒童體能',
    sortOrder: 6,
    suggestedTags: ['兒童體能', '感統', '跑跳遊戲'],
  },

  // —— 職涯專業 ——
  {
    id: 'pro-office',
    categoryId: 'career_exams',
    name: '辦公軟體／Excel',
    sortOrder: 1,
    suggestedTags: ['Excel', 'PowerPoint', 'Word', 'Google 試算表'],
  },
  {
    id: 'pro-career',
    categoryId: 'career_exams',
    name: '履歷／面試／轉職',
    sortOrder: 2,
    suggestedTags: ['履歷健診', '面試英文', '轉職諮詢', '作品集輔導'],
  },
  {
    id: 'pro-finance',
    categoryId: 'career_exams',
    name: '會計／金融／投資入門',
    sortOrder: 3,
    suggestedTags: ['會計', '簿記', '投資理財入門', '財報'],
  },
  {
    id: 'pro-marketing',
    categoryId: 'career_exams',
    name: '行銷／社群／電商',
    sortOrder: 4,
    suggestedTags: ['社群經營', '廣告投放', '電商', '文案'],
  },
  {
    id: 'pro-certs',
    categoryId: 'career_exams',
    name: '證照／專業檢定',
    sortOrder: 5,
    suggestedTags: ['證照考試', '專業檢定', '公職準備'],
  },
  {
    id: 'pro-design-tools',
    categoryId: 'career_exams',
    name: '設計工具／剪輯',
    sortOrder: 6,
    suggestedTags: ['Canva', 'Photoshop', 'Premiere', '剪輯'],
  },

  // —— 生活興趣 ——
  {
    id: 'life-tutoring',
    categoryId: 'lifestyle_hobbies',
    name: '陪讀／課後照顧',
    sortOrder: 1,
    suggestedTags: ['陪讀', '課後照顧', '作業指導', '到府'],
  },
  {
    id: 'life-cooking',
    categoryId: 'lifestyle_hobbies',
    name: '烹飪／烘焙',
    sortOrder: 2,
    suggestedTags: ['家常菜', '烘焙', '甜點'],
  },
  {
    id: 'life-craft',
    categoryId: 'lifestyle_hobbies',
    name: '手作／園藝／興趣',
    sortOrder: 3,
    suggestedTags: ['手作', '園藝', '棋類', '旅遊'],
  },
  {
    id: 'life-skills',
    categoryId: 'lifestyle_hobbies',
    name: '生活技能／駕駛',
    sortOrder: 4,
    suggestedTags: ['生活技能', '駕駛陪練', '居家整理'],
  },

  // —— 個人成長 ——
  {
    id: 'growth-psych',
    categoryId: 'personal_development',
    name: '心理學／情緒管理',
    sortOrder: 1,
    suggestedTags: ['心理學入門', '情緒管理', '壓力調適', '冥想入門'],
  },
  {
    id: 'growth-comms',
    categoryId: 'personal_development',
    name: '溝通／人際關係',
    sortOrder: 2,
    suggestedTags: ['溝通技巧', '人際關係', '表達力', '簡報表達'],
  },
  {
    id: 'growth-habits',
    categoryId: 'personal_development',
    name: '時間管理／自我成長',
    sortOrder: 3,
    suggestedTags: ['時間管理', '自我成長', '習慣養成', '讀書會'],
  },
  {
    id: 'growth-niche',
    categoryId: 'personal_development',
    name: '其他成長主題',
    sortOrder: 4,
    suggestedTags: ['生涯探索', '客製成長課程'],
  },
];

/** @deprecated 請用 LEGACY_SUBJECT_TO_MAIN；保留相容 */
export const LEGACY_SUBJECT_CATEGORY_MAP: Record<string, string> = {
  ...LEGACY_SUBJECT_TO_MAIN,
};

export function getTaxonomyTree(): TaxonomyTree[] {
  return TAXONOMY_CATEGORIES.map((cat) => ({
    ...cat,
    subcategories: TAXONOMY_SUBCATEGORIES.filter((s) => s.categoryId === cat.id).sort(
      (a, b) => a.sortOrder - b.sortOrder
    ),
  }));
}

export function getCategoryById(id: string): TaxonomyCategory | undefined {
  const key = LEGACY_CATEGORY_ID_TO_MAIN[id] || id;
  return TAXONOMY_CATEGORIES.find((c) => c.id === key);
}

export function getSubcategoryById(id: string): TaxonomySubcategory | undefined {
  return TAXONOMY_SUBCATEGORIES.find((s) => s.id === id);
}

export function categoryDisplayName(categoryId: string): string {
  const key = (LEGACY_CATEGORY_ID_TO_MAIN[categoryId] ||
    categoryId) as MainCategoryKey;
  return mainCategoryLabel(key);
}

/** 將任意 subjectCategory／舊 id 解析成 main_category key */
export function resolveCategoryId(subjectCategory: string): MainCategoryKey {
  return resolveMainCategory({ subjectCategory });
}

/** 導師是否屬於某大類（含舊字串／舊 id 相容） */
export function tutorBelongsToCategory(
  subjectCategory: string,
  categoryId: string,
  mainCategory?: string | null,
  tutorCategoryId?: string | null
): boolean {
  if (categoryId === 'all') return true;
  const target = LEGACY_CATEGORY_ID_TO_MAIN[categoryId] || categoryId;
  const resolved = resolveMainCategory({
    mainCategory,
    categoryId: tutorCategoryId,
    subjectCategory,
  });
  return resolved === target;
}
