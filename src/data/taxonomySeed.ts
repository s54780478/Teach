import type { TaxonomyCategory, TaxonomySubcategory, TaxonomyTree } from '@/types/taxonomy';

/**
 * 第一層＋第二層：寫死於程式（低維護）。
 * 第三層自訂標籤走 DB；無金鑰時仍可用 suggestedTags 刊登。
 */
export const TAXONOMY_CATEGORIES: TaxonomyCategory[] = [
  { id: 'academic', name: '升學與學科', icon: 'GraduationCap', sortOrder: 1 },
  { id: 'languages', name: '語言與檢定', icon: 'Languages', sortOrder: 2 },
  { id: 'programming', name: '程式與資訊科技', icon: 'Code2', sortOrder: 3 },
  { id: 'arts', name: '音樂與藝術', icon: 'Music', sortOrder: 4 },
  { id: 'sports', name: '運動與健身', icon: 'Dumbbell', sortOrder: 5 },
  { id: 'professional', name: '職涯與專業技能', icon: 'Briefcase', sortOrder: 6 },
  { id: 'lifestyle', name: '生活、陪讀與興趣', icon: 'Heart', sortOrder: 7 },
  { id: 'others', name: '其他與創新領域', icon: 'Sparkles', sortOrder: 8 },
];

export const TAXONOMY_SUBCATEGORIES: TaxonomySubcategory[] = [
  // —— 升學與學科 ——
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

  // —— 語言與檢定 ——
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

  // —— 程式與資訊 ——
  {
    id: 'prog-web',
    categoryId: 'programming',
    name: '網頁／前端',
    sortOrder: 1,
    suggestedTags: ['React', 'Next.js', 'HTML/CSS', 'JavaScript', '作品集'],
  },
  {
    id: 'prog-python',
    categoryId: 'programming',
    name: 'Python／資料科學',
    sortOrder: 2,
    suggestedTags: ['Python 入門', '資料分析', '機器學習', '爬蟲'],
  },
  {
    id: 'prog-app',
    categoryId: 'programming',
    name: 'App／後端',
    sortOrder: 3,
    suggestedTags: ['Flutter', 'Swift', 'Node.js', 'SQL'],
  },
  {
    id: 'prog-kids',
    categoryId: 'programming',
    name: '兒童程式／創客',
    sortOrder: 4,
    suggestedTags: ['Scratch', 'Minecraft 程式', 'Arduino', '機器人'],
  },
  {
    id: 'prog-ai',
    categoryId: 'programming',
    name: 'AI／自動化',
    sortOrder: 5,
    suggestedTags: ['ChatGPT 應用', 'AI 繪圖', '自動化腳本', 'Prompt'],
  },

  // —— 音樂與藝術 ——
  {
    id: 'arts-piano',
    categoryId: 'arts',
    name: '鋼琴／鍵盤',
    sortOrder: 1,
    suggestedTags: ['鋼琴', '流行伴奏', '古典鋼琴', '檢定'],
  },
  {
    id: 'arts-guitar',
    categoryId: 'arts',
    name: '吉他／烏克麗麗',
    sortOrder: 2,
    suggestedTags: ['吉他', '烏克麗麗', '自彈自唱', 'Fingerstyle'],
  },
  {
    id: 'arts-vocal',
    categoryId: 'arts',
    name: '歌唱／聲樂',
    sortOrder: 3,
    suggestedTags: ['唱歌', '流行歌唱', '發聲', 'VTuber 聲優'],
  },
  {
    id: 'arts-visual',
    categoryId: 'arts',
    name: '美術／插畫／設計',
    sortOrder: 4,
    suggestedTags: ['素描', '插畫', '水彩', '作品集', '平面設計'],
  },
  {
    id: 'arts-other',
    categoryId: 'arts',
    name: '其他樂器／表演',
    sortOrder: 5,
    suggestedTags: ['小提琴', '鼓', '長笛', '舞蹈'],
  },

  // —— 運動與健身 ——
  {
    id: 'sports-fitness',
    categoryId: 'sports',
    name: '健身／重訓',
    sortOrder: 1,
    suggestedTags: ['重訓', '減脂', '增肌', '居家健身'],
  },
  {
    id: 'sports-yoga',
    categoryId: 'sports',
    name: '瑜珈／皮拉提斯',
    sortOrder: 2,
    suggestedTags: ['瑜珈', '皮拉提斯', '伸展'],
  },
  {
    id: 'sports-ball',
    categoryId: 'sports',
    name: '球類',
    sortOrder: 3,
    suggestedTags: ['羽球', '籃球', '網球', '游泳'],
  },
  {
    id: 'sports-martial',
    categoryId: 'sports',
    name: '武術／自衛',
    sortOrder: 4,
    suggestedTags: ['跆拳道', '柔道', '拳擊', '自衛術'],
  },
  {
    id: 'sports-kids',
    categoryId: 'sports',
    name: '兒童體能',
    sortOrder: 5,
    suggestedTags: ['兒童體能', '感統', '跑跳遊戲'],
  },

  // —— 職涯與專業 ——
  {
    id: 'pro-office',
    categoryId: 'professional',
    name: '辦公軟體／Excel',
    sortOrder: 1,
    suggestedTags: ['Excel', 'PowerPoint', 'Word', 'Google 試算表'],
  },
  {
    id: 'pro-career',
    categoryId: 'professional',
    name: '履歷／面試／轉職',
    sortOrder: 2,
    suggestedTags: ['履歷健診', '面試英文', '轉職諮詢', '作品集輔導'],
  },
  {
    id: 'pro-finance',
    categoryId: 'professional',
    name: '會計／金融／投資入門',
    sortOrder: 3,
    suggestedTags: ['會計', '簿記', '投資理財入門', '財報'],
  },
  {
    id: 'pro-marketing',
    categoryId: 'professional',
    name: '行銷／社群／電商',
    sortOrder: 4,
    suggestedTags: ['社群經營', '廣告投放', '電商', '文案'],
  },
  {
    id: 'pro-design-tools',
    categoryId: 'professional',
    name: '設計工具／剪輯',
    sortOrder: 5,
    suggestedTags: ['Canva', 'Photoshop', 'Premiere', '剪輯'],
  },

  // —— 生活、陪讀與興趣 ——
  {
    id: 'life-tutoring',
    categoryId: 'lifestyle',
    name: '陪讀／課後照顧',
    sortOrder: 1,
    suggestedTags: ['陪讀', '課後照顧', '作業指導', '到府'],
  },
  {
    id: 'life-cooking',
    categoryId: 'lifestyle',
    name: '烹飪／烘焙',
    sortOrder: 2,
    suggestedTags: ['家常菜', '烘焙', '甜點'],
  },
  {
    id: 'life-craft',
    categoryId: 'lifestyle',
    name: '手作／興趣',
    sortOrder: 3,
    suggestedTags: ['手作', '園藝', '攝影', '棋類'],
  },
  {
    id: 'life-life-skills',
    categoryId: 'lifestyle',
    name: '生活技能／駕駛',
    sortOrder: 4,
    suggestedTags: ['生活英文', '時間管理', '駕駛陪練'],
  },
  {
    id: 'life-wellbeing',
    categoryId: 'lifestyle',
    name: '心靈／諮商取向（非醫療）',
    sortOrder: 5,
    suggestedTags: ['讀書會', '冥想入門', '壓力調適分享'],
  },

  // —— 其他與創新 ——
  {
    id: 'others-emerging',
    categoryId: 'others',
    name: '新興技能',
    sortOrder: 1,
    suggestedTags: ['元宇宙', '區塊鏈入門', '創業分享'],
  },
  {
    id: 'others-niche',
    categoryId: 'others',
    name: '小眾專長',
    sortOrder: 2,
    suggestedTags: ['特殊專長', '客製課程'],
  },
  {
    id: 'others-uncategorized',
    categoryId: 'others',
    name: '尚未歸類',
    sortOrder: 3,
    suggestedTags: ['其他'],
  },
];

/** 舊版 subjectCategory 字串 → 新大類 id（相容既有資料） */
export const LEGACY_SUBJECT_CATEGORY_MAP: Record<string, string> = {
  數理升學: 'academic',
  語文寫作: 'academic',
  外語學習: 'languages',
  程式設計: 'programming',
  音樂藝術: 'arts',
  體育運動: 'sports',
  商業金融: 'professional',
  其他: 'others',
  升學與學科: 'academic',
  語言與檢定: 'languages',
  程式與資訊科技: 'programming',
  音樂與藝術: 'arts',
  運動與健身: 'sports',
  職涯與專業技能: 'professional',
  '生活、陪讀與興趣': 'lifestyle',
  其他與創新領域: 'others',
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
  return TAXONOMY_CATEGORIES.find((c) => c.id === id);
}

export function getSubcategoryById(id: string): TaxonomySubcategory | undefined {
  return TAXONOMY_SUBCATEGORIES.find((s) => s.id === id);
}

export function categoryDisplayName(categoryId: string): string {
  return getCategoryById(categoryId)?.name ?? '其他與創新領域';
}

/** 將任意 subjectCategory 字串解析成大類 id */
export function resolveCategoryId(subjectCategory: string): string {
  const mapped = LEGACY_SUBJECT_CATEGORY_MAP[subjectCategory.trim()];
  if (mapped) return mapped;
  const byName = TAXONOMY_CATEGORIES.find((c) => c.name === subjectCategory.trim());
  if (byName) return byName.id;
  return 'others';
}

/** 導師是否屬於某大類（含舊字串相容） */
export function tutorBelongsToCategory(
  subjectCategory: string,
  categoryId: string
): boolean {
  if (categoryId === 'all') return true;
  return resolveCategoryId(subjectCategory) === categoryId;
}
