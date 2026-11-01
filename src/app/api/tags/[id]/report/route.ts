import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/authFromRequest';
import { TAG_REPORT_HIDE_THRESHOLD } from '@/lib/tagNormalize';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/tags/:id/report
 * Body: { reason?: string }
 * 同一使用者對同一標籤僅能檢舉一次；達 3 次由 DB trigger 自動 disabled
 */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: '請先登入後再檢舉' }, { status: 401 });
  }

  const { id: tagId } = await ctx.params;
  if (!tagId) {
    return NextResponse.json({ error: '缺少標籤 id' }, { status: 400 });
  }

  let reason: string | null = null;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    reason = body.reason ? String(body.reason).slice(0, 200) : null;
  } catch {
    reason = null;
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: '資料庫未設定' }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const db = admin || supabase;

  const { data: tag } = await db
    .from('tags')
    .select('id,status,report_count')
    .eq('id', tagId)
    .maybeSingle();

  if (!tag?.id) {
    return NextResponse.json({ error: '找不到標籤' }, { status: 404 });
  }

  if (tag.status === 'disabled') {
    return NextResponse.json({
      ok: true,
      alreadyDisabled: true,
      status: 'disabled',
    });
  }

  const { error } = await db.from('tag_reports').insert({
    tag_id: tagId,
    reporter_id: user.id,
    reason,
  });

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return NextResponse.json(
        { error: '您已檢舉過此標籤', code: 'already_reported' },
        { status: 409 }
      );
    }
    // 無 service role 且 RLS 擋下時
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: updated } = await db
    .from('tags')
    .select('id,status,report_count')
    .eq('id', tagId)
    .maybeSingle();

  const reportCount = (updated?.report_count as number) ?? (tag.report_count || 0) + 1;
  const status = (updated?.status as string) || tag.status;

  return NextResponse.json({
    ok: true,
    tagId,
    reportCount,
    status,
    hidden: status === 'disabled' || reportCount >= TAG_REPORT_HIDE_THRESHOLD,
    hideThreshold: TAG_REPORT_HIDE_THRESHOLD,
  });
}
