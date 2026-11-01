import type { MainCategoryKey } from '@/types/mainCategory';
import { isMainCategoryKey } from '@/types/mainCategory';
import {
  LEGACY_SUBJECT_TO_MAIN,
  MAIN_CATEGORY_LABEL,
  resolveMainCategory,
} from '@/data/mainCategories';
import { MOCK_TUTORS } from '@/data/mockTutors';
import { resolveSubjectTaxonomy } from '@/data/subjectTaxonomy';
import { fromTagSlug, isAsciiTagSlug, toTagSlug } from '@/lib/tagSlug';

/** 安全 decode（Next params 可能已解碼） */
export function decodePathSegment(raw: string): string {
  const value = (raw || '').trim();
  if (!value) return '';
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value;
  }
}

/**
 * URL tag segment → 顯示／搜尋用標籤 + 正規英文 slug
 * 支援：英文 slug、舊版中文 path（會建議 redirect 到 slug）
 */
export function resolveTagParam(raw: string): {
  displayTag: string;
  canonicalSlug: string;
  /** path 不是正規英文 slug 時應 redirect */
  needsRedirect: boolean;
} {
  const decoded = decodePathSegment(raw);
  if (!decoded) {
    return { displayTag: '', canonicalSlug: '', needsRedirect: false };
  }

  // 1) 已是英文 slug（含 t. fallback）
  if (isAsciiTagSlug(decoded) || isAsciiTagSlug(decoded.toLowerCase())) {
    const displayTag = fromTagSlug(decoded);
    const canonicalSlug = displayTag ? toTagSlug(displayTag) : decoded.toLowerCase();
    const needsRedirect =
      Boolean(displayTag) && decoded !== canonicalSlug && decoded.toLowerCase() !== canonicalSlug;
    return {
      displayTag: displayTag || decoded,
      canonicalSlug,
      needsRedirect,
    };
  }

  // 2) 舊連結：中文／非 ASCII 顯示名直接當 path
  const displayTag = decoded;
  const canonicalSlug = toTagSlug(displayTag);
  return {
    displayTag,
    canonicalSlug,
    needsRedirect: canonicalSlug !== decoded,
  };
}

/** @deprecated 改用 resolveTagParam；保留相容 */
export function decodeTagParam(raw: string): string {
  return resolveTagParam(raw).displayTag;
}

export function mainCategoryDisplayName(key: string): string {
  if (isMainCategoryKey(key)) return MAIN_CATEGORY_LABEL[key];
  return '全部分類';
}

/** `/tutors/{main_category}` */
export function buildTutorsCategoryPath(mainCategory: MainCategoryKey): string {
  return `/tutors/${mainCategory}`;
}

/** `/tutors/{main_category}/{english-slug}` — 網址不含中文 */
export function buildTutorsTagPath(
  mainCategory: MainCategoryKey,
  tag: string
): string {
  const t = tag.trim();
  if (!t) return buildTutorsCategoryPath(mainCategory);
  const slug = toTagSlug(t);
  return `/tutors/${mainCategory}/${slug}`;
}

/**
 * 全部分類下點子標籤：推導應導向的大類。
 * 優先 taxonomy／別名，其次示範導師 tag 出現次數。
 */
export function resolveMainCategoryForTag(tag: string): MainCategoryKey | null {
  const raw = tag.trim();
  if (!raw) return null;

  const tax = resolveSubjectTaxonomy(raw);
  if (tax?.parent && LEGACY_SUBJECT_TO_MAIN[tax.parent]) {
    return LEGACY_SUBJECT_TO_MAIN[tax.parent];
  }

  const slug = toTagSlug(raw);
  const votes = new Map<MainCategoryKey, number>();
  for (const tutor of MOCK_TUTORS) {
    const hit = (tutor.specialtyTags || []).some((t) => {
      if (t === raw || t.toLowerCase() === raw.toLowerCase()) return true;
      return toTagSlug(t) === slug;
    });
    if (!hit) continue;
    const main = resolveMainCategory({
      mainCategory: tutor.mainCategory,
      categoryId: tutor.categoryId,
      subjectCategory: tutor.subjectCategory,
    });
    votes.set(main, (votes.get(main) || 0) + 1);
  }

  let best: MainCategoryKey | null = null;
  let bestN = 0;
  for (const [k, n] of votes) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

/** 組出標籤頁 path；全部分類時自動推導大類 */
export function buildTutorsPathForTag(
  tag: string,
  preferredMain?: MainCategoryKey | 'all' | string | null
): string | null {
  const t = tag.trim();
  if (!t) return null;
  if (preferredMain && isMainCategoryKey(preferredMain)) {
    return buildTutorsTagPath(preferredMain, t);
  }
  const inferred = resolveMainCategoryForTag(t);
  if (!inferred) return null;
  return buildTutorsTagPath(inferred, t);
}

/**
 * 硬導向（與 LogoHomeLink 同策略）。
 * App Router soft nav 在編碼路徑上較容易卡住。
 */
export function navigateTutorsPath(href: string): void {
  if (typeof window === 'undefined') return;
  const next = href.trim();
  if (!next) return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === next) return;
  window.location.assign(next);
}

export function buildTutorsTagTitle(
  decodedTag: string,
  categoryName: string
): string {
  // layout template 會再加「｜ idaltu」
  return `${decodedTag} 家教/課程推薦 - ${categoryName}`;
}

export function buildTutorsTagDescription(decodedTag: string): string {
  return `尋找最適合你的 ${decodedTag} 私人導師。免費瀏覽履歷與介紹影片，學生訂閱解鎖聯繫方式。`;
}
