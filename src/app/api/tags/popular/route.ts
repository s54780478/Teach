import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { isMainCategoryKey } from '@/types/mainCategory';
import { MAIN_CATEGORIES } from '@/data/mainCategories';
import {
  POPULAR_TAG_DEFAULT_LIMIT,
  POPULAR_TAG_MIN_COUNT,
  aggregatePopularTags,
  aggregatePopularTagsFromMock,
  mergeTutorsForTagAgg,
  type PopularTag,
} from '@/lib/popularTags';
import { mapDbRowToTutor, type TutorDbRow } from '@/lib/tutorService';

export const runtime = 'nodejs';

/**
 * GET /api/tags/popular?main_category=languages&limit=24&min_count=2
 * Steam 式：依大類（或全站）統計 active 導師 specialty_tags 頻率。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mainRaw = (searchParams.get('main_category') || '').trim();
  const limit = Math.min(
    50,
    Math.max(
      1,
      Number(searchParams.get('limit') || POPULAR_TAG_DEFAULT_LIMIT) ||
        POPULAR_TAG_DEFAULT_LIMIT
    )
  );
  // 有指定大類時門檻降為 1，否則示範老師 tags 常因 min_count=2 被 RPC 濾光
  const minCountDefault = mainRaw ? 1 : POPULAR_TAG_MIN_COUNT;
  const minCount = Math.max(
    1,
    Number(searchParams.get('min_count') || minCountDefault) || minCountDefault
  );

  if (mainRaw && !isMainCategoryKey(mainRaw)) {
    return NextResponse.json(
      {
        error: 'invalid_main_category',
        message: 'main_category 必須為固定 8 大分類之一',
        allowed: MAIN_CATEGORIES.map((c) => c.key),
      },
      { status: 400 }
    );
  }

  const mainCategory = isMainCategoryKey(mainRaw) ? mainRaw : null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('popular_tutor_tags', {
        p_main_category: mainCategory,
        p_limit: limit,
        p_min_count: minCount,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        let tags: PopularTag[] = data
          .map((row: Record<string, unknown>) => ({
            tag: String(row.tag || ''),
            count: Number(row.count) || 0,
            // RPC 有指定大類時直接帶上；全站則由前端／mock 聚合補 mainCategory
            ...(mainCategory ? { mainCategory } : {}),
          }))
          .filter((t) => t.tag);

        // DB 示範列偏舊／缺類時，用 MOCK 補齊該大類 tags
        if (tags.length < 4) {
          const fromMock = aggregatePopularTagsFromMock({
            mainCategory: mainCategory || '',
            limit,
            minCount: 1,
          });
          const seen = new Set(tags.map((t) => t.tag.toLowerCase()));
          for (const t of fromMock) {
            if (!seen.has(t.tag.toLowerCase())) {
              tags.push(t);
              seen.add(t.tag.toLowerCase());
            }
          }
          tags = tags.slice(0, limit);
        }

        return NextResponse.json({
          tags,
          main_category: mainCategory,
          source: 'rpc',
          min_count: minCount,
        });
      }
    } catch {
      /* fall through */
    }

    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .or('is_published.eq.true,is_published.is.null')
        .limit(500);

      if (!error && Array.isArray(data)) {
        const mapped = data.map((row) => mapDbRowToTutor(row as TutorDbRow));
        const merged = mergeTutorsForTagAgg(mapped);
        let tags = aggregatePopularTags(merged, {
          mainCategory: mainCategory || '',
          limit,
          minCount,
        });
        if (tags.length === 0) {
          tags = aggregatePopularTags(merged, {
            mainCategory: mainCategory || '',
            limit,
            minCount: 1,
          });
        }

        return NextResponse.json({
          tags,
          main_category: mainCategory,
          source: 'aggregate',
          min_count: minCount,
        });
      }
    } catch {
      /* fall through to mock */
    }
  }

  const tags = aggregatePopularTagsFromMock({
    mainCategory: mainCategory || '',
    limit,
    minCount: 1,
  });

  return NextResponse.json({
    tags,
    main_category: mainCategory,
    source: 'mock',
    min_count: 1,
  });
}
