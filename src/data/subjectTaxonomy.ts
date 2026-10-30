/**
 * Superprof 式學科階層：大類 → 細項
 * 用於麵包屑（例：idaltu > 音樂 > 唱歌）
 */

export interface SubjectTaxonomyNode {
  /** 大類顯示名（例：音樂） */
  parent: string;
  /** 細項顯示名；與 parent 相同時表示本身就是大類 */
  label: string;
}

/** 細項／別名 → 階層 */
const SUBJECT_PARENT_MAP: Record<string, SubjectTaxonomyNode> = {
  音樂: { parent: '音樂', label: '音樂' },
  唱歌: { parent: '音樂', label: '唱歌' },
  鋼琴: { parent: '音樂', label: '鋼琴' },
  吉他: { parent: '音樂', label: '吉他' },
  小提琴: { parent: '音樂', label: '小提琴' },

  數理: { parent: '數理', label: '數理' },
  數學: { parent: '數理', label: '數學' },
  理化: { parent: '數理', label: '理化' },
  物理: { parent: '數理', label: '物理' },
  化學: { parent: '數理', label: '化學' },

  語言: { parent: '語言', label: '語言' },
  英文: { parent: '語言', label: '英文' },
  英語: { parent: '語言', label: '英文' },
  日文: { parent: '語言', label: '日文' },
  日語: { parent: '語言', label: '日文' },
  中文: { parent: '語言', label: '中文' },
  國文: { parent: '語言', label: '國文' },
  雅思: { parent: '語言', label: '雅思' },
  托福: { parent: '語言', label: '托福' },

  程式: { parent: '程式設計', label: '程式' },
  程式設計: { parent: '程式設計', label: '程式設計' },
  程式語言: { parent: '程式設計', label: '程式' },

  運動: { parent: '運動', label: '運動' },
  健身: { parent: '運動', label: '健身' },
};

export function resolveSubjectTaxonomy(
  subjectRaw: string
): SubjectTaxonomyNode | null {
  const key = subjectRaw.trim();
  if (!key || key === 'all' || key === '全部') return null;
  return SUBJECT_PARENT_MAP[key] ?? { parent: key, label: key };
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
