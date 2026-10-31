/**
 * Superprof 式學科階層：大類 → 子類／標籤
 * 用於麵包屑（例：idaltu > 語言與檢定 > 日文）
 */
import {
  TAXONOMY_CATEGORIES,
  TAXONOMY_SUBCATEGORIES,
  resolveCategoryId,
  categoryDisplayName,
} from '@/data/taxonomySeed';

export interface SubjectTaxonomyNode {
  parent: string;
  label: string;
}

/** 細項／別名 → 階層（熱門關鍵字補強） */
const SUBJECT_ALIAS_MAP: Record<string, SubjectTaxonomyNode> = {
  數學: { parent: '升學與學科', label: '高中數學' },
  理化: { parent: '升學與學科', label: '國中數學／理化' },
  物理: { parent: '升學與學科', label: '物理／化學／生物' },
  化學: { parent: '升學與學科', label: '物理／化學／生物' },
  國文: { parent: '升學與學科', label: '國文／作文' },
  英文: { parent: '語言與檢定', label: '英文／英語' },
  英語: { parent: '語言與檢定', label: '英文／英語' },
  日文: { parent: '語言與檢定', label: '日文' },
  日語: { parent: '語言與檢定', label: '日文' },
  韓文: { parent: '語言與檢定', label: '韓文' },
  雅思: { parent: '語言與檢定', label: '雅思／托福／多益' },
  托福: { parent: '語言與檢定', label: '雅思／托福／多益' },
  多益: { parent: '語言與檢定', label: '雅思／托福／多益' },
  程式: { parent: '程式與資訊科技', label: '網頁／前端' },
  程式設計: { parent: '程式與資訊科技', label: '網頁／前端' },
  Python: { parent: '程式與資訊科技', label: 'Python／資料科學' },
  音樂: { parent: '音樂與藝術', label: '鋼琴／鍵盤' },
  鋼琴: { parent: '音樂與藝術', label: '鋼琴／鍵盤' },
  吉他: { parent: '音樂與藝術', label: '吉他／烏克麗麗' },
  唱歌: { parent: '音樂與藝術', label: '歌唱／聲樂' },
  健身: { parent: '運動與健身', label: '健身／重訓' },
  運動: { parent: '運動與健身', label: '球類' },
};

export function resolveSubjectTaxonomy(
  subjectRaw: string
): SubjectTaxonomyNode | null {
  const key = subjectRaw.trim();
  if (!key || key === 'all' || key === '全部') return null;

  if (SUBJECT_ALIAS_MAP[key]) return SUBJECT_ALIAS_MAP[key];

  const cat = TAXONOMY_CATEGORIES.find((c) => c.name === key || c.id === key);
  if (cat) return { parent: cat.name, label: cat.name };

  const sub = TAXONOMY_SUBCATEGORIES.find((s) => s.name === key || s.id === key);
  if (sub) {
    return { parent: categoryDisplayName(sub.categoryId), label: sub.name };
  }

  const parentId = resolveCategoryId(key);
  const parent = categoryDisplayName(parentId);
  if (parent !== key && LEGACY_ONLY(key)) {
    return { parent, label: key };
  }

  return { parent: key, label: key };
}

function LEGACY_ONLY(key: string): boolean {
  return [
    '數理升學',
    '外語學習',
    '程式設計',
    '音樂藝術',
    '語文寫作',
    '商業金融',
    '體育運動',
    '其他',
  ].includes(key);
}

/** 麵包屑片段：大類；若有細項且不同於大類則再加一層 */
export function subjectBreadcrumbParts(
  subjectRaw: string
): { parent: string; leaf: string | null } | null {
  const node = resolveSubjectTaxonomy(subjectRaw);
  if (!node) return null;
  const leaf = node.label !== node.parent ? node.label : null;
  return { parent: node.parent, leaf };
}
