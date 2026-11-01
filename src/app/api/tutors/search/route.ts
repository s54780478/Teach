import { NextRequest, NextResponse } from 'next/server';
import { searchTutors } from '@/lib/tutorService';
import { isMainCategoryKey } from '@/types/mainCategory';
import { MAIN_CATEGORIES } from '@/data/mainCategories';

/**
 * GET /api/tutors/search
 * - main_category：固定 8 key 之一（有設才過濾分類）
 * - q / subject：關鍵字，主要比對 tags（不強制分類）
 * - 兩者同時有：AND
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mainRaw = (searchParams.get('main_category') || '').trim();
  const q = (
    searchParams.get('q') ||
    searchParams.get('subject') ||
    searchParams.get('keyword') ||
    ''
  ).trim();
  const region = (searchParams.get('region') || '').trim();
  const modeRaw = (searchParams.get('mode') || 'all').trim();
  const sortRaw = (searchParams.get('sortBy') || 'recommended').trim();

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

  const mode =
    modeRaw === 'in-person' || modeRaw === 'online' || modeRaw === 'hybrid'
      ? modeRaw
      : 'all';
  const sortBy =
    sortRaw === 'rating' ||
    sortRaw === 'price-asc' ||
    sortRaw === 'price-desc' ||
    sortRaw === 'popularity' ||
    sortRaw === 'reviews' ||
    sortRaw === 'recommended'
      ? sortRaw
      : 'recommended';

  const result = await searchTutors({
    mainCategory: isMainCategoryKey(mainRaw) ? mainRaw : '',
    q,
    subject: q,
    region,
    mode,
    sortBy,
    onlyPublished: true,
  });

  return NextResponse.json({
    tutors: result.tutors,
    count: result.tutors.length,
    isFromSupabase: result.isFromSupabase,
    filters: {
      main_category: isMainCategoryKey(mainRaw) ? mainRaw : null,
      q: q || null,
      region: region || null,
      mode,
      sortBy,
    },
    error: result.error || null,
  });
}
