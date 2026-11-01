import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/authFromRequest';
import { validateTagForCreate } from '@/lib/tagBlocklist';
import {
  MAX_TAGS_PER_TUTOR,
  TAG_PUBLIC_USAGE_THRESHOLD,
  normalizeTagInput,
} from '@/lib/tagNormalize';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { TAXONOMY_SUBCATEGORIES } from '@/data/taxonomySeed';

export const runtime = 'nodejs';

/**
 * GET /api/tags?q=&limit=&publicOnly=1
 * 模糊搜尋標籤（pg_trgm RPC；失敗則降級 ilike／種子）
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const publicOnly = searchParams.get('publicOnly') !== '0';

  if (!q) {
    return NextResponse.json({ tags: [] });
  }

  const qNorm = normalizeTagInput(q);
  const queryKey = qNorm.ok ? qNorm.name : q.toLowerCase();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('search_tags_fuzzy', {
        q: queryKey,
        lim: limit,
        public_only: publicOnly,
      });

      if (!error && Array.isArray(data)) {
        return NextResponse.json({
          tags: data.map((row: Record<string, unknown>) => ({
            id: row.id,
            name: row.name,
            displayName: row.display_name || row.name,
            categoryId: row.category_id ?? null,
            subcategoryId: row.subcategory_id ?? null,
            status: row.status,
            usageCount: row.usage_count,
            score: row.score,
          })),
        });
      }

      // RPC 尚未部署：ilike 降級 + 公開過濾
      let query = supabase
        .from('tags')
        .select('id,name,display_name,category_id,subcategory_id,status,usage_count')
        .neq('status', 'disabled')
        .or(`name.ilike.%${queryKey}%,display_name.ilike.%${queryKey}%`)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (publicOnly) {
        query = query.eq('status', 'approved').gte('usage_count', TAG_PUBLIC_USAGE_THRESHOLD);
      }

      const { data: rows } = await query;
      if (rows) {
        return NextResponse.json({
          tags: rows.map((row) => ({
            id: row.id,
            name: row.name,
            displayName: row.display_name || row.name,
            categoryId: row.category_id,
            subcategoryId: row.subcategory_id,
            status: row.status,
            usageCount: row.usage_count,
          })),
        });
      }
    } catch {
      /* fall through */
    }
  }

  const local = TAXONOMY_SUBCATEGORIES.flatMap((s) => s.suggestedTags)
    .filter((n) => n.toLowerCase().includes(queryKey) || queryKey.includes(n.toLowerCase()))
    .slice(0, limit)
    .map((name, i) => ({
      id: `seed-${i}`,
      name: name.toLowerCase(),
      displayName: name,
      categoryId: null,
      subcategoryId: null,
      status: 'approved',
      usageCount: TAG_PUBLIC_USAGE_THRESHOLD,
    }));

  return NextResponse.json({ tags: local });
}

/**
 * POST /api/tags
 * Body: { name, categoryId?, subcategoryId? }
 * Header: Authorization Bearer
 * 正規化 + 黑名單；違規回 400
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: '無效的 JSON' }, { status: 400 });
  }

  const rawName = String(body.name || '');
  const validated = validateTagForCreate(rawName);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.message || '標籤無效', code: validated.code },
      { status: 400 }
    );
  }

  const categoryId = body.categoryId ? String(body.categoryId) : null;
  const subcategoryId = body.subcategoryId ? String(body.subcategoryId) : null;

  const admin = getSupabaseAdmin();
  const db = admin || supabase;

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      tag: {
        id: null,
        name: validated.name,
        displayName: validated.displayName,
        status: 'pending',
        usageCount: 1,
      },
      offline: true,
    });
  }

  const { data: existing } = await db
    .from('tags')
    .select('id,name,display_name,status,usage_count')
    .eq('name', validated.name)
    .maybeSingle();

  if (existing?.id) {
    if (existing.status === 'disabled') {
      return NextResponse.json(
        { error: '此標籤已下架，無法使用', code: 'disabled' },
        { status: 400 }
      );
    }
    return NextResponse.json({
      tag: {
        id: existing.id,
        name: existing.name,
        displayName: existing.display_name || existing.name,
        status: existing.status,
        usageCount: existing.usage_count,
      },
      existed: true,
    });
  }

  const { data: created, error } = await db
    .from('tags')
    .insert({
      name: validated.name,
      display_name: validated.displayName,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      status: 'pending',
      usage_count: 1,
      created_by_user_id: user.id,
    })
    .select('id,name,display_name,status,usage_count')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    tag: {
      id: created?.id,
      name: created?.name,
      displayName: created?.display_name || created?.name,
      status: created?.status || 'pending',
      usageCount: created?.usage_count || 1,
    },
    maxTagsPerTutor: MAX_TAGS_PER_TUTOR,
  });
}
