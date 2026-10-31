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

const TAG_PROMOTE_THRESHOLD = 5;
const MAX_TAG_LEN = 40;

function normalizeTagName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LEN);
}

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
      // DB 缺的種子子類仍顯示（低維護：程式種子優先補齊）
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

/** 熱門／已核准標籤（搜尋建議） */
export async function fetchPopularTags(limit = 40): Promise<TaxonomyTag[]> {
  if (!isSupabaseConfigured) {
    const fromSeed = TAXONOMY_SUBCATEGORIES.flatMap((s) =>
      s.suggestedTags.map((name, i) => ({
        id: `seed-${s.id}-${i}`,
        categoryId: s.categoryId,
        subcategoryId: s.id,
        name,
        status: 'approved' as const,
        usageCount: 10,
      }))
    );
    const uniq = new Map<string, TaxonomyTag>();
    for (const t of fromSeed) {
      if (!uniq.has(t.name)) uniq.set(t.name, t);
    }
    return Array.from(uniq.values()).slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('tags')
      .select('id,category_id,subcategory_id,name,status,usage_count')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error || !data) return fetchPopularTagsFallback();

    return data.map((row) => ({
      id: row.id as string,
      categoryId: (row.category_id as string) || null,
      subcategoryId: (row.subcategory_id as string) || null,
      name: row.name as string,
      status: (row.status as TaxonomyTag['status']) || 'pending',
      usageCount: (row.usage_count as number) || 0,
    }));
  } catch {
    return fetchPopularTagsFallback();
  }
}

function fetchPopularTagsFallback(): TaxonomyTag[] {
  return TAXONOMY_SUBCATEGORIES.flatMap((s) =>
    s.suggestedTags.slice(0, 2).map((name, i) => ({
      id: `seed-${s.id}-${i}`,
      categoryId: s.categoryId,
      subcategoryId: s.id,
      name,
      status: 'approved' as const,
      usageCount: 1,
    }))
  );
}

/**
 * 確保標籤存在於池中：已存在則 usage+1；否則立即建立（pending，免審核即可用）
 */
export async function ensureTag(params: {
  name: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  userId?: string | null;
}): Promise<{ tagId: string | null; name: string; error?: string }> {
  const name = normalizeTagName(params.name);
  if (!name) return { tagId: null, name: '', error: '標籤不可為空' };

  if (!isSupabaseConfigured) {
    return { tagId: null, name };
  }

  try {
    const { data: existing } = await supabase
      .from('tags')
      .select('id,usage_count,status')
      .eq('name', name)
      .maybeSingle();

    if (existing?.id) {
      const nextCount = ((existing.usage_count as number) || 0) + 1;
      const nextStatus =
        nextCount >= TAG_PROMOTE_THRESHOLD ? 'approved' : (existing.status as string) || 'pending';
      await supabase
        .from('tags')
        .update({ usage_count: nextCount, status: nextStatus })
        .eq('id', existing.id);
      return { tagId: existing.id as string, name };
    }

    const { data: created, error } = await supabase
      .from('tags')
      .insert({
        name,
        category_id: params.categoryId || null,
        subcategory_id: params.subcategoryId || null,
        status: 'pending',
        usage_count: 1,
        created_by_user_id: params.userId || null,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      // 併發唯一鍵：再讀一次
      const { data: again } = await supabase
        .from('tags')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      if (again?.id) return { tagId: again.id as string, name };
      return { tagId: null, name, error: error.message };
    }

    return { tagId: (created?.id as string) || null, name };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '標籤寫入失敗';
    return { tagId: null, name, error: message };
  }
}

/** 同步導師的 tutor_tags，並回寫 specialty_tags／category 欄位用的 payload */
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
  const tags = Array.from(
    new Set(selection.tags.map(normalizeTagName).filter(Boolean))
  ).slice(0, 12);

  if (!isSupabaseConfigured) {
    return {
      specialtyTags: tags,
      subjectCategory,
      categoryId: selection.categoryId,
      subcategoryId: selection.subcategoryId,
    };
  }

  const tagIds: string[] = [];
  for (const name of tags) {
    const res = await ensureTag({
      name,
      categoryId: selection.categoryId,
      subcategoryId: selection.subcategoryId,
      userId,
    });
    if (res.tagId) tagIds.push(res.tagId);
  }

  try {
    await supabase.from('tutor_tags').delete().eq('tutor_id', tutorId);
    if (tagIds.length > 0) {
      await supabase.from('tutor_tags').insert(
        tagIds.map((tag_id) => ({ tutor_id: tutorId, tag_id }))
      );
    }

    await supabase
      .from('tutors')
      .update({
        category_id: selection.categoryId,
        subcategory_id: selection.subcategoryId || null,
        specialty_tags: tags,
        subject_category: subjectCategory,
      })
      .eq('id', tutorId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '同步標籤失敗';
    return {
      specialtyTags: tags,
      subjectCategory,
      categoryId: selection.categoryId,
      subcategoryId: selection.subcategoryId,
      error: message,
    };
  }

  return {
    specialtyTags: tags,
    subjectCategory,
    categoryId: selection.categoryId,
    subcategoryId: selection.subcategoryId,
  };
}

/** 依關鍵字找標籤名稱（前台搜尋補強） */
export async function searchTagNames(query: string, limit = 20): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  const localHits = TAXONOMY_SUBCATEGORIES.flatMap((s) => [
    s.name,
    ...s.suggestedTags,
  ]).filter((n) => n.toLowerCase().includes(q.toLowerCase()));

  if (!isSupabaseConfigured) {
    return Array.from(new Set(localHits)).slice(0, limit);
  }

  try {
    const { data } = await supabase
      .from('tags')
      .select('name')
      .ilike('name', `%${q}%`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    const fromDb = (data || []).map((r) => r.name as string);
    return Array.from(new Set([...fromDb, ...localHits])).slice(0, limit);
  } catch {
    return Array.from(new Set(localHits)).slice(0, limit);
  }
}

export function selectionFromLegacy(params: {
  subjectCategory: string;
  specialtyTags: string[];
  categoryId?: string | null;
  subcategoryId?: string | null;
}): TutorTaxonomySelection {
  const categoryId =
    params.categoryId || resolveCategoryId(params.subjectCategory || 'academic');

  let subcategoryId = params.subcategoryId || '';
  if (!subcategoryId || !getSubcategoryById(subcategoryId)) {
    const first = TAXONOMY_SUBCATEGORIES.find((s) => s.categoryId === categoryId);
    subcategoryId = first?.id || 'others-uncategorized';
  }

  return {
    categoryId,
    subcategoryId,
    tags: params.specialtyTags || [],
  };
}

export { TAXONOMY_CATEGORIES, categoryDisplayName };
