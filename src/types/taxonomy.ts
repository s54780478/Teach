/** 三層技能／科目分類 */

export type TaxonomyTagStatus = 'pending' | 'approved';

export interface TaxonomyCategory {
  id: string;
  name: string;
  /** lucide icon 名稱（可選） */
  icon: string;
  sortOrder: number;
}

export interface TaxonomySubcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  /** 刊登時建議點選的熱門標籤 */
  suggestedTags: string[];
}

export interface TaxonomyTag {
  id: string;
  categoryId: string | null;
  subcategoryId: string | null;
  name: string;
  status: TaxonomyTagStatus;
  usageCount: number;
}

export interface TaxonomyTree extends TaxonomyCategory {
  subcategories: TaxonomySubcategory[];
}

/** 導師刊登／編輯時選到的分類狀態 */
export interface TutorTaxonomySelection {
  categoryId: string;
  subcategoryId: string;
  /** 第三層標籤名稱（可含自訂） */
  tags: string[];
}
