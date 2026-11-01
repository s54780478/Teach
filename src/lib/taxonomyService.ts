import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import {
  categoryDisplayName,
  getSubcategoryById,
  getTaxonomyTree,
  resolveCategoryId,
  TAXONOMY_CATEGORIES,
  TAXONOMY_SUBCATEGORIES,
} from '@/data/taxonomySeed';
import type { TaxonomyTag, TaxonomyTree, TutorTaxonomySelection } from '@/types/taxonomy';
import { validateTagForCreateClient } from '@/lib/tagBlocklistClient';
import {
  MAX_TAGS_PER_TUTOR,
  TAG_PUBLIC_USAGE_THRESHOLD,
  normalizeTagInput,
  normalizeTagList,
} from '@/lib/tagNormalize';

/** 瀏覽器安全驗證；API 路由請改用 tagBlocklist.validateTagForCreate */
const validateTagForCreate = validateTagForCreateClient;

/** 讀取完整分類樹（永遠可用靜態種子；有 DB 時可擴充） */
export function getLocalTaxonomyTree(): TaxonomyTree[] {
  return getTaxonomyTree();
}

export async function fetchTaxonomyTree(): Promise<TaxonomyTree[]> {
  if (!isSupabaseConfigured) return getLocalTaxonomyTree();

  try {
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from('categories').select('id,name,icon,sort_order').order('sort_order'),
      supabase.from('subcategories').select('id,category_id,name,sort_order').order('sort_order'),
    ]);

    if (!cats?.length) return getLocalTaxonomyTree();

    return cats.map((c) => {
      const seedSubs = TAXONOMY_SUBCATEGORIES.filter((s) => s.categoryId === c.id);
      const dbSubs = (subs || []).filter((s) => s.category_id === c.id);
      const merged = dbSubs.map((s) => {
        const seed = seedSubs.find((x) => x.id === s.id);
        return {
          id: s.id as string,
          categoryId: s.category_id as string,
          name: s.name as string,
          sortOrder: (s.sort_order as number) ?? 0,
          suggestedTags: seed?.suggestedTags ?? [],
        };
      });
      for (const seed of seedSubs) {
        if (!merged.some((m) => m.id === seed.id)) merged.push(seed);
      }
      merged.sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        id: c.id as string,
        name: c.name as string,
        icon: (c.icon as string) || 'Sparkles',
        sortOrder: (c.sort_order as number) ?? 0,
        subcategories: merged,
      };
    });
  } catch {
    return getLocalTaxonomyTree();
  }
}

/**
 * 全站公共選單：僅 approved 且 usage_count >= 5（隔離 pending／disabled）
 */
export async function fetchPublicMenuTags(limit = 40): Promise<TaxonomyTag[]> {
  if (!isSupabaseConfigured) {
    return fetchPopularTagsFallback().map((t) => ({
      ...t,
      usageCount: TAG_PUBLIC_USAGE_THRESHOLD,
    }));
  }

  try {
    const { data, error } = await supabase
      .from('tags')
      .select('id,category_id,subcategory_id,name,display_name,status,usage_count')
      .eq('status', 'approved')
      .gte('usage_count', TAG_PUBLIC_USAGE_THRESHOLD)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error || !data) return fetchPopularTagsFallback();

    return data.map((row) => mapTagRow(row));
  } catch {
    return fetchPopularTagsFallback();
  }
}

/** @deprecated 請用 fetchPublicMenuTags；保留別名 */
export async function fetchPopularTags(limit = 40): Promise<TaxonomyTag[]> {
  return fetchPublicMenuTags(limit);
}

function mapTagRow(row: Record<string, unknown>): TaxonomyTag {
  return {
    id: row.id as string,
    categoryId: (row.category_id as string) || null,
    subcategoryId: (row.subcategory_id as string) || null,
    name: row.name as string,
    displayName: (row.display_name as string) || (row.name as string),
    status: (row.status as TaxonomyTag['status']) || 'pending',
    usageCount: (row.usage_count as number) || 0,
    reportCount: (row.report_count as number) || 0,
  };
}

function fetchPopularTagsFallback(): TaxonomyTag[] {
  return TAXONOMY_SUBCATEGORIES.flatMap((s) =>
    s.suggestedTags.slice(0, 2).map((name, i) => {
      const n = normalizeTagInput(name);
      return {
        id: `seed-${s.id}-${i}`,
        categoryId: s.categoryId,
        subcategoryId: s.id,
        name: n.ok ? n.name : name.toLowerCase(),
        displayName: n.ok ? n.displayName : name,
        status: 'approved' as const,
        usageCount: TAG_PUBLIC_USAGE_THRESHOLD,
      };
    })
  );
}

/**
 * 確保標籤存在：正規化 + 黑名單；disabled 拒絕；新標籤 pending（不進公共選單）
 */
export async function ensureTag(params: {
  name: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  userId?: string | null;
}): Promise<{ tagId: string | null; name: string; displayName?: string; error?: string }> {
  const validated = validateTagForCreate(params.name);
  if (!validated.ok) {
    return { tagId: null, name: validated.name, error: validated.message };
  }

  if (!isSupabaseConfigured) {
    return {
      tagId: null,
      name: validated.name,
      displayName: validated.displayName,
    };
  }

  try {
    const { data: existing } = await supabase
      .from('tags')
      .select('id,usage_count,status,display_name,name')
      .eq('name', validated.name)
      .maybeSingle();

    if (existing?.id) {
      if (existing.status === 'disabled') {
        return {
          tagId: null,
          name: validated.name,
          error: '此標籤已下架，無法使用',
        };
      }
      const nextCount = ((existing.usage_count as number) || 0) + 1;
      const patch: Record<string, unknown> = { usage_count: nextCount };
      if (!existing.display_name) patch.display_name = validated.displayName;
      // status 升格交由 DB trigger（usage_count >= 5）
      await supabase.from('tags').update(patch).eq('id', existing.id);
      return {
        tagId: existing.id as string,
        name: existing.name as string,
        displayName: (existing.display_name as string) || validated.displayName,
      };
    }

    const { data: created, error } = await supabase
      .from('tags')
      .insert({
        name: validated.name,
        display_name: validated.displayName,
        category_id: params.categoryId || null,
        subcategory_id: params.subcategoryId || null,
        status: 'pending',
        usage_count: 1,
        created_by_user_id: params.userId || null,
      })
      .select('id,name,display_name')
      .maybeSingle();

    if (error) {
      const { data: again } = await supabase
        .from('tags')
        .select('id,name,display_name,status')
        .eq('name', validated.name)
        .maybeSingle();
      if (again?.id && again.status !== 'disabled') {
        return {
          tagId: again.id as string,
          name: again.name as string,
          displayName: (again.display_name as string) || validated.displayName,
        };
      }
      return { tagId: null, name: validated.name, error: error.message };
    }

    return {
      tagId: (created?.id as string) || null,
      name: (created?.name as string) || validated.name,
      displayName: (created?.display_name as string) || validated.displayName,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '標籤寫入失敗';
    return { tagId: null, name: validated.name, error: message };
  }
}

/** 同步導師標籤（最多 5 個） */
export async function syncTutorTaxonomy(
  tutorId: string,
  selection: TutorTaxonomySelection,
  userId?: string | null
): Promise<{
  specialtyTags: string[];
  subjectCategory: string;
  categoryId: string;
  subcategoryId: string;
  error?: string;
}> {
  const subjectCategory = categoryDisplayName(selection.categoryId);
  const normalized = normalizeTagList(selection.tags, MAX_TAGS_PER_TUTOR);
  if (normalized.error && normalized.tags.length === 0) {
    return {
      specialtyTags: [],
      subjectCategory,
      categoryId: selection.categoryId,
      subcategoryId: '',
      error: normalized.error,
    };
  }

  // 顯示名寫入 specialty_tags（前台可讀）；最多 5
  const displayTags = normalized.tags.map((t) => t.displayName).slice(0, MAX_TAGS_PER_TUTOR);

  for (const t of normalized.tags) {
    const blocked = validateTagForCreate(t.displayName);
    if (!blocked.ok) {
      return {
        specialtyTags: displayTags,
        subjectCategory,
        categoryId: selection.categoryId,
        subcategoryId: '',
        error: blocked.message,
      };
    }
  }

  if (!isSupabaseConfigured) {
    return {
      specialtyTags: displayTags,
      subjectCategory,
      categoryId: selection.categoryId,
      subcategoryId: '',
      error: normalized.error,
    };
  }

  const tagIds: string[] = [];
  for (const t of normalized.tags) {
    const res = await ensureTag({
      name: t.displayName,
      categoryId: selection.categoryId,
      subcategoryId: null,
      userId,
    });
    if (res.error && !res.tagId) {
      return {
        specialtyTags: displayTags,
        subjectCategory,
        categoryId: selection.categoryId,
        subcategoryId: '',
        error: res.error,
      };
    }
    if (res.tagId) tagIds.push(res.tagId);
  }

  try {
    await supabase.from('tutor_tags').delete().eq('tutor_id', tutorId);
    if (tagIds.length > 0) {
      await supabase.from('tutor_tags').insert(
        tagIds.map((tag_id) => ({ tutor_id: tutorId, tag_id }))
      );
    }

    const { resolveMainCategory, mainCategoryLabel } = await import(
      '@/data/mainCategories'
    );
    const mainCategory = resolveMainCategory({
      categoryId: selection.categoryId,
      subjectCategory,
    });

    await supabase
      .from('tutors')
      .update({
        main_category: mainCategory,
        category_id: mainCategory,
        specialty_tags: displayTags,
        subject_category: subjectCategory || mainCategoryLabel(mainCategory),
      })
      .eq('id', tutorId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '同步標籤失敗';
    return {
      specialtyTags: displayTags,
      subjectCategory,
      categoryId: selection.categoryId,
      subcategoryId: '',
      error: message,
    };
  }

  return {
    specialtyTags: displayTags,
    subjectCategory,
    categoryId: selection.categoryId,
    subcategoryId: '',
    error: normalized.error,
  };
}

/** 客戶端呼叫搜尋 API（模糊） */
export async function searchTagsViaApi(
  query: string,
  opts?: { limit?: number; publicOnly?: boolean; accessToken?: string }
): Promise<TaxonomyTag[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({
    q,
    limit: String(opts?.limit ?? 20),
    publicOnly: opts?.publicOnly === false ? '0' : '1',
  });
  const headers: HeadersInit = {};
  if (opts?.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }
  const res = await fetch(`/api/tags?${params.toString()}`, { headers });
  if (!res.ok) return [];
  const json = (await res.json()) as { tags?: TaxonomyTag[] };
  return json.tags || [];
}

/** 依關鍵字找標籤（本機／舊路徑；優先建議改走 searchTagsViaApi） */
export async function searchTagNames(query: string, limit = 20): Promise<string[]> {
  const tags = await searchTagsViaApi(query, { limit, publicOnly: true });
  if (tags.length) return tags.map((t) => t.displayName || t.name);

  const q = query.trim().toLowerCase();
  if (!q) return [];
  const localHits = TAXONOMY_SUBCATEGORIES.flatMap((s) => [s.name, ...s.suggestedTags]).filter(
    (n) => n.toLowerCase().includes(q)
  );
  return Array.from(new Set(localHits)).slice(0, limit);
}

export function selectionFromLegacy(params: {
  subjectCategory: string;
  specialtyTags: string[];
  categoryId?: string | null;
  subcategoryId?: string | null;
}): TutorTaxonomySelection {
  const categoryId =
    params.categoryId || resolveCategoryId(params.subjectCategory || 'academic');

  const normalized = normalizeTagList(params.specialtyTags || [], MAX_TAGS_PER_TUTOR);

  return {
    categoryId,
    subcategoryId: '',
    tags: normalized.tags.map((t) => t.displayName),
  };
}

export {
  TAXONOMY_CATEGORIES,
  categoryDisplayName,
  MAX_TAGS_PER_TUTOR,
  TAG_PUBLIC_USAGE_THRESHOLD,
};
