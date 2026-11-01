/** 三層技能／科目分類 */

export type TaxonomyTagStatus = 'pending' | 'approved' | 'disabled';

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
  /** 正規化鍵（小寫） */
  name: string;
  /** 顯示名稱 */
  displayName?: string;
  status: TaxonomyTagStatus;
  usageCount: number;
  reportCount?: number;
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
