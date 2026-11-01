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

/** 導師刊登／編輯：大類 + 標籤（不再使用子類） */
export interface TutorTaxonomySelection {
  /** main_category key（8 大固定） */
  categoryId: string;
  /** @deprecated 已移除 UI；保留相容，寫入時應為空 */
  subcategoryId?: string;
  /** 專長標籤（最多 5） */
  tags: string[];
}
