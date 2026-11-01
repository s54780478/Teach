import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import type {
  FreeLessonMinutes,
  MainCategoryKey,
  TeachingMode,
  TeachingModeOption,
  Tutor,
} from '@/types/tutor';
import { MOCK_TUTORS } from '@/data/mockTutors';
import {
  mainCategoryLabel,
  resolveMainCategory,
} from '@/data/mainCategories';
import { isMainCategoryKey } from '@/types/mainCategory';
import {
  DEFAULT_RESPONSE_TIME,
  deriveLegacyMode,
  minutesToResponseTime,
  normalizeTeachingModes,
  responseTimeToMinutes,
  tutorMatchesModeFilter,
} from '@/lib/teachingModes';
import { tutorMatchesKeyword, tutorMatchesMainCategory } from '@/lib/tutorFilters';
import {
  extractYoutubeUrlFromText,
  stripExternalLinksFromText,
  validateOptionalYoutubeUrl,
} from '@/lib/youtubeUrl';
import {
  compareByPopularity,
  compareByRecommended,
} from '@/lib/tutorRanking';

/** 冷啟動示範導師 id（tutor-1…），與真實註冊 UUID 分開 */
export function isDemoTutorId(id: string): boolean {
  return /^tutor-\d+$/.test(id);
}

const EMPTY_CONTACT = { lineId: '', phone: '', email: '' } as const;

/** 公開列表／履歷：不帶出聯絡方式（買方解鎖制） */
export function redactTutorContact(tutor: Tutor): Tutor {
  return { ...tutor, contact: { ...EMPTY_CONTACT } };
}

/**
 * 已通過 Student Pass 流程後再取聯絡方式。
 * 示範老師：從 MOCK；真實老師：單筆讀取（完整防洩需 DB view，見 supabase/tutors_public_view.sql）
 */
export async function resolveTutorContact(
  tutorId: string
): Promise<Tutor['contact'] | null> {
  if (isDemoTutorId(tutorId)) {
    const mock = MOCK_TUTORS.find((t) => t.id === tutorId);
    return mock?.contact ?? null;
  }
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('tutors')
      .select('line_id, phone, email')
      .eq('id', tutorId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      lineId: data.line_id || '未提供',
      phone: data.phone || '未提供',
      email: data.email || '未提供',
    };
  } catch {
    return null;
  }
}

/** 可能尚未在正式 DB 執行遷移的欄位（缺了就降級略過；youtube_url 不在此列） */
const OPTIONAL_TUTOR_COLUMNS = [
  'teaching_modes',
  'free_lesson_minutes',
  'response_time',
  'response_speed_minutes',
  'category_id',
  'main_category',
  'is_verified',
  'is_identity_verified',
  'is_diploma_verified',
] as const;

function stripAllOptionalTutorColumns(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...fields };
  for (const col of OPTIONAL_TUTOR_COLUMNS) {
    delete next[col];
  }
  return next;
}

function omitMissingColumnFromPayload(
  fields: Record<string, unknown>,
  errorMessage: string
): Record<string, unknown> | null {
  const missing = errorMessage.match(
    /Could not find the '([^']+)' column/i
  )?.[1];
  if (!missing || !(missing in fields)) return null;

  const next = { ...fields };
  delete next[missing];
  // 成對欄位一併拿掉，避免下一輪又撞 schema cache
  if (missing === 'response_time') delete next.response_speed_minutes;
  if (missing === 'response_speed_minutes') delete next.response_time;
  if (missing === 'main_category') delete next.category_id;
  if (missing === 'category_id') delete next.main_category;
  return next;
}

/**
 * 寫入 tutors：遇「欄位不在 schema cache」自動拿掉該欄重試。
 * youtube_url 不走此函式（由 persistTutorYoutubeUrl 獨立處理）。
 */
async function writeTutorRow(params: {
  userId: string;
  fields: Record<string, unknown>;
  mode: 'update' | 'insert';
  insertExtras?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  let payload: Record<string, unknown> = { ...params.fields };
  let strippedAll = false;

  for (let attempt = 0; attempt < 8; attempt++) {
    const result =
      params.mode === 'update'
        ? await supabase.from('tutors').update(payload).eq('id', params.userId)
        : await supabase.from('tutors').insert([
            {
              id: params.userId,
              ...payload,
              ...(params.insertExtras || {}),
            },
          ]);

    if (!result.error) return { success: true };

    const msg = result.error.message;
    console.error(`⚠️ tutors ${params.mode} 失敗 (attempt ${attempt + 1}):`, msg);

    const trimmed = omitMissingColumnFromPayload(payload, msg);
    if (trimmed) {
      payload = trimmed;
      continue;
    }

    if (
      !strippedAll &&
      (/schema cache|could not find the '/i.test(msg) ||
        /teaching_modes|free_lesson_minutes|response_time|response_speed|category_id|main_category/i.test(
          msg
        ))
    ) {
      payload = stripAllOptionalTutorColumns(payload);
      strippedAll = true;
      continue;
    }

    return { success: false, error: msg };
  }

  return {
    success: false,
    error:
      '儲存失敗：資料庫缺少欄位。請於 Supabase SQL Editor 執行 supabase/tutor_superprof_fields.sql 後再試。',
  };
}

function youtubeColumnMissingError(resolvedYoutube: string | null | undefined) {
  if (!resolvedYoutube) return null;
  return {
    success: false as const,
    error:
      '資料庫尚未建立 youtube_url 欄位。請於 Supabase SQL Editor 執行 supabase/tutor_youtube.sql 後再儲存一次。',
  };
}

/**
 * 影片欄位獨立寫入並回讀驗證，避免主檔降級重試時把 youtube_url 拿掉。
 * resolved === undefined → 不改動既有值；null → 清除；string → 寫入。
 */
async function persistTutorYoutubeUrl(
  userId: string,
  resolved: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  if (resolved === undefined) return { success: true };

  const { data, error } = await supabase
    .from('tutors')
    .update({ youtube_url: resolved })
    .eq('id', userId)
    .select('id, youtube_url')
    .maybeSingle();

  if (error) {
    if (/youtube_url/i.test(error.message)) {
      const blocked = youtubeColumnMissingError(resolved);
      if (blocked) return blocked;
    }
    return { success: false, error: error.message };
  }

  if (!data) {
    return {
      success: false,
      error: '影片未寫入（可能未登入或無權限）。請重新登入後再儲存一次。',
    };
  }

  if (resolved && data.youtube_url !== resolved) {
    return {
      success: false,
      error: '影片網址儲存失敗，請再試一次。若持續失敗請確認已執行 supabase/tutor_youtube.sql。',
    };
  }

  return { success: true };
}

/** 解析要寫入的 youtube：有值就用；空白則保留 DB 既有（不洗掉）；rescue 自 bio */
function resolveYoutubeForSave(
  inputYoutubeUrl: string | null | undefined,
  existingYoutubeUrl: string | null | undefined,
  bio: string,
  headline: string,
  clearYoutube?: boolean
): { ok: true; value: string | null | undefined } | { ok: false; message: string } {
  if (clearYoutube) return { ok: true, value: null };

  if (inputYoutubeUrl === undefined) {
    return { ok: true, value: undefined };
  }

  const trimmed = (inputYoutubeUrl || '').trim();
  if (trimmed) {
    const yt = validateOptionalYoutubeUrl(trimmed);
    if (!yt.ok) return { ok: false, message: yt.message };
    return { ok: true, value: yt.value };
  }

  // 表單空白：先試從簡介救援，否則不改動 DB（保留已存影片）
  const rescued =
    extractYoutubeUrlFromText(bio) || extractYoutubeUrlFromText(headline);
  if (rescued) return { ok: true, value: rescued };
  if (existingYoutubeUrl) return { ok: true, value: undefined };
  return { ok: true, value: undefined };
}

/**
 * 列表一律帶上程式內示範導師（覆蓋全部 8 大類），
 * 並隱藏 DB 裡同 id 的舊 seed；真實註冊導師（如 UUID）照常顯示。
 * 示範列永遠以 MOCK_TUTORS 為準，避免舊 seed 缺類別時點分類是空的。
 */
function mergeDemoCatalog(dbTutors: Tutor[]): Tutor[] {
  const real = dbTutors.filter((t) => !isDemoTutorId(t.id));
  const byId = new Map<string, Tutor>();
  // 先放真實導師，再強制覆寫示範 id → 保證 8 大類都有假老師
  for (const t of real) byId.set(t.id, t);
  for (const t of MOCK_TUTORS) byId.set(t.id, t);
  return Array.from(byId.values());
}

/** Supabase tutors 列（與 schema + tutor_superprof_fields.sql 對齊） */
export interface TutorDbRow {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  degree: string | null;
  specialty_tags: string[] | null;
  subject_category: string | null;
  main_category?: string | null;
  category_id?: string | null;
  /** @deprecated 已遷移進 specialty_tags；讀取時忽略 */
  subcategory_id?: string | null;
  city: string | null;
  district: string | null;
  display_location: string | null;
  mode: string | null;
  teaching_modes?: string[] | null;
  hourly_rate: number;
  first_lesson_free: boolean | null;
  free_lesson_minutes?: number | null;
  response_time?: string | null;
  response_speed_minutes: number | null;
  taught_hours: number | null;
  rating: number | null;
  review_count: number | null;
  badge: string | null;
  line_id: string | null;
  phone: string | null;
  email: string | null;
  is_published?: boolean | null;
  is_verified?: boolean | null;
  is_identity_verified?: boolean | null;
  is_diploma_verified?: boolean | null;
  youtube_url?: string | null;
}

export type CourseStatus = 'active' | 'paused';

export interface TutorCourseRow {
  id: string;
  tutor_id: string;
  title: string;
  subject: string | null;
  subject_category: string | null;
  region_city: string | null;
  region_district: string | null;
  mode: string | null;
  hourly_rate: number | null;
  description: string | null;
  first_lesson_free: boolean | null;
  status: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TutorCourse {
  id: string;
  tutorId: string;
  title: string;
  subject: string;
  subjectCategory: string;
  city: string;
  district: string;
  mode: TeachingMode;
  hourlyRate: number;
  description: string;
  firstLessonFree: boolean;
  status: CourseStatus;
  updatedAt?: string;
}

export interface TutorSearchFilters {
  region?: string;
  /** 關鍵字（優先比對 tags；不強制 main_category） */
  subject?: string;
  /** 別名：與 subject 相同語意 */
  q?: string;
  /** 固定 8 大一級分類；有設才過濾 */
  mainCategory?: MainCategoryKey | '';
  minRate?: number;
  maxRate?: number;
  mode?: 'all' | 'in-person' | 'online' | 'hybrid';
  sortBy?:
    | 'recommended'
    | 'price-asc'
    | 'price-desc'
    | 'rating'
    | 'popularity'
    | 'reviews';
  onlyPublished?: boolean;
}

export function mapCourseRow(row: TutorCourseRow): TutorCourse {
  const mode: TeachingMode =
    row.mode === 'in-person' || row.mode === 'online' || row.mode === 'hybrid'
      ? row.mode
      : 'hybrid';
  return {
    id: row.id,
    tutorId: row.tutor_id,
    title: row.title,
    subject: row.subject || '',
    subjectCategory: row.subject_category || '',
    city: row.region_city || '',
    district: row.region_district || '',
    mode,
    hourlyRate: Number(row.hourly_rate) || 0,
    description: row.description || '',
    firstLessonFree: Boolean(row.first_lesson_free),
    status: row.status === 'paused' ? 'paused' : 'active',
    updatedAt: row.updated_at,
  };
}

export interface TutorProfileInput {
  name: string;
  headline: string;
  bio: string;
  degree: string;
  specialtyTags: string[];
  subjectCategory: string;
  /** 固定 8 大 key；缺省時由 categoryId／subjectCategory 推導 */
  mainCategory?: MainCategoryKey;
  categoryId?: string;
  city: string;
  district: string;
  /** 相容欄位；若有 teachingModes 則由 modes 推導 */
  mode?: TeachingMode;
  teachingModes: TeachingModeOption[];
  hourlyRate: number;
  firstLessonFree: boolean;
  freeLessonMinutes?: FreeLessonMinutes;
  responseTime?: string;
  lineId: string;
  phone: string;
  email?: string;
  /** 自訂頭像公開 URL；空則沿用既有或預設頭像 */
  avatarUrl?: string;
  /**
   * YouTube 自我介紹（選填）。
   * 有字串 → 寫入；空白／未傳 → 保留資料庫既有；clearYoutube → 清除。
   */
  youtubeUrl?: string | null;
  clearYoutube?: boolean;
}

function parseFreeLessonMinutes(raw: unknown): FreeLessonMinutes {
  const n = Number(raw);
  if (n === 30 || n === 45 || n === 60) return n;
  return 60;
}

export function mapDbRowToTutor(
  row: TutorDbRow,
  options?: { includeContact?: boolean }
): Tutor {
  const legacyMode: TeachingMode =
    row.mode === 'in-person' || row.mode === 'online' || row.mode === 'hybrid'
      ? row.mode
      : 'hybrid';
  const teachingModes = normalizeTeachingModes(row.teaching_modes, legacyMode);
  const mode = deriveLegacyMode(teachingModes);
  const responseSpeedMinutes = Number(row.response_speed_minutes) || 60;
  const responseTime =
    (row.response_time && row.response_time.trim()) ||
    minutesToResponseTime(responseSpeedMinutes) ||
    DEFAULT_RESPONSE_TIME;

  const identityVerified = Boolean(
    row.is_identity_verified ?? row.is_verified ?? false
  );
  const diplomaVerified = Boolean(
    row.is_diploma_verified ?? row.is_verified ?? false
  );
  const isVerified = Boolean(
    row.is_verified || identityVerified || diplomaVerified
  );

  const mainCategory = resolveMainCategory({
    mainCategory: row.main_category,
    categoryId: row.category_id,
    subjectCategory: row.subject_category,
  });

  const yt = validateOptionalYoutubeUrl(row.youtube_url || '');

  return {
    id: row.id,
    name: row.name,
    headline: stripExternalLinksFromText((row.headline || '').slice(0, 50)),
    bio: stripExternalLinksFromText(row.bio || ''),
    youtubeUrl: yt.ok ? yt.value : null,
    avatarUrl:
      row.avatar_url ||
      `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(row.name || row.id)}&backgroundColor=ffdfdf`,
    verification: {
      isIdentityVerified: identityVerified,
      isDiplomaVerified: diplomaVerified,
      degree: row.degree || '官方認證學歷',
    },
    isVerified,
    specialtyTags: Array.isArray(row.specialty_tags) ? row.specialty_tags : [],
    mainCategory,
    subjectCategory: row.subject_category || mainCategoryLabel(mainCategory),
    categoryId: row.category_id || mainCategory,
    location: {
      city: row.city || '台北市',
      district: row.district || '',
      displayLocation: row.display_location || '全台線上',
    },
    mode,
    teachingModes,
    hourlyRate: Number(row.hourly_rate) || 800,
    firstLessonFree: row.first_lesson_free !== false,
    freeLessonMinutes: parseFreeLessonMinutes(row.free_lesson_minutes),
    responseTime,
    responseSpeedMinutes,
    taughtHours: Number(row.taught_hours) || 100,
    reviews: {
      rating: Number(row.rating) || 5.0,
      reviewCount: Number(row.review_count) || 0,
    },
    badge: (row.badge as Tutor['badge']) || undefined,
    // 公開 mapping 預設不帶聯絡方式；本人後台／解鎖後再帶
    contact: options?.includeContact
      ? {
          lineId: row.line_id || '未提供',
          phone: row.phone || '未提供',
          email: row.email || '未提供',
        }
      : { ...EMPTY_CONTACT },
  };
}

/**
 * 依 Auth UID 讀取目前登入者的導師履歷（用於編輯）
 */
export async function getTutorProfileByUserId(
  userId: string
): Promise<Tutor | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ 讀取個人導師履歷失敗:', error.message);
      return null;
    }
    if (!data) return null;
    return mapDbRowToTutor(data as TutorDbRow, { includeContact: true });
  } catch (err) {
    console.warn('⚠️ 讀取個人導師履歷異常:', err);
    return null;
  }
}

/**
 * 新增或更新導師履歷（id 綁定 Supabase Auth UID）
 */
export async function upsertTutorProfile(
  userId: string,
  input: TutorProfileInput
): Promise<{ success: boolean; error?: string }> {
  const displayLocation = input.district.trim()
    ? `${input.city.trim()}${input.district.trim()}`
    : input.city.trim();

  const teachingModes = normalizeTeachingModes(
    input.teachingModes,
    input.mode || 'hybrid'
  );
  const mode = deriveLegacyMode(teachingModes);
  const responseTime =
    (input.responseTime && input.responseTime.trim()) || DEFAULT_RESPONSE_TIME;
  const freeLessonMinutes = input.freeLessonMinutes ?? 60;
  const dicebear = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name.trim())}&backgroundColor=f9a8d4`;

  try {
    const existing = await getTutorProfileByUserId(userId);
    // avatarUrl 有傳入：用新值（空字串＝改回預設頭像）；未傳入：保留既有
    const avatarUrl =
      input.avatarUrl !== undefined
        ? input.avatarUrl.trim() || dicebear
        : existing?.avatarUrl || dicebear;

    const mainCategory = resolveMainCategory({
      mainCategory: input.mainCategory,
      categoryId: input.categoryId,
      subjectCategory: input.subjectCategory,
    });

    const ytResolved = resolveYoutubeForSave(
      input.youtubeUrl,
      existing?.youtubeUrl,
      input.bio,
      input.headline,
      input.clearYoutube
    );
    if (!ytResolved.ok) return { success: false, error: ytResolved.message };
    const resolvedYoutube = ytResolved.value;

    // 主檔不含 youtube_url（改由 persistTutorYoutubeUrl 獨立寫入驗證）
    const sharedFields: Record<string, unknown> = {
      name: input.name.trim(),
      headline: stripExternalLinksFromText(input.headline.trim()).slice(0, 50),
      bio: stripExternalLinksFromText(input.bio.trim()),
      degree: input.degree.trim() || null,
      specialty_tags: input.specialtyTags,
      main_category: mainCategory,
      subject_category:
        input.subjectCategory.trim() || mainCategoryLabel(mainCategory),
      category_id: input.categoryId || mainCategory,
      city: input.city.trim(),
      district: input.district.trim() || null,
      display_location: displayLocation,
      mode,
      teaching_modes: teachingModes,
      hourly_rate: input.hourlyRate,
      first_lesson_free: input.firstLessonFree,
      free_lesson_minutes: freeLessonMinutes,
      response_time: responseTime,
      response_speed_minutes: responseTimeToMinutes(responseTime),
      line_id: input.lineId.trim() || null,
      phone: input.phone.trim() || null,
      email: input.email?.trim() || null,
      avatar_url: avatarUrl,
      is_published: true,
    };

    const writeResult = await writeTutorRow({
      userId,
      fields: sharedFields,
      mode: existing ? 'update' : 'insert',
      insertExtras: existing
        ? undefined
        : {
            rating: 5.0,
            review_count: 0,
            taught_hours: 0,
            badge: '新星特選',
            is_verified: false,
          },
    });
    if (!writeResult.success) return writeResult;

    const ytPersist = await persistTutorYoutubeUrl(userId, resolvedYoutube);
    if (!ytPersist.success) return ytPersist;

    // 同步寫入／更新 courses（課程刊登列）；表不存在時不阻斷 tutors 成功
    const courseSync = await upsertTutorCourse(userId, input);
    if (!courseSync.success) {
      console.warn('⚠️ courses 同步提示:', courseSync.error);
    }

    // 第三層動態標籤池（動態 import，避免 Client 拉進 bad-words）
    if (input.categoryId) {
      try {
        const { syncTutorTaxonomy } = await import('@/lib/taxonomyService');
        const tagSync = await syncTutorTaxonomy(
          userId,
          {
            categoryId: input.categoryId,
            tags: input.specialtyTags,
          },
          userId
        );
        if (tagSync.error) {
          console.warn('⚠️ taxonomy 同步提示:', tagSync.error);
        }
      } catch (err) {
        console.warn('⚠️ taxonomy 同步略過:', err);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '寫入失敗';
    console.error('⚠️ 寫入導師履歷異常:', err);
    return { success: false, error: message };
  }
}

/** 為導師維護一筆主課程（courses 表） */
export async function upsertTutorCourse(
  tutorId: string,
  input: TutorProfileInput
): Promise<{ success: boolean; error?: string }> {
  const title =
    input.headline.trim() ||
    `${input.name.trim()} 的${input.specialtyTags[0] || input.subjectCategory}課程`;

  const coursePayload = {
    tutor_id: tutorId,
    title,
    subject: input.specialtyTags[0] || input.subjectCategory,
    subject_category: input.subjectCategory,
    region_city: input.city.trim() || null,
    region_district: input.district.trim() || null,
    mode: input.mode,
    hourly_rate: input.hourlyRate,
    description: input.bio.trim() || null,
    first_lesson_free: input.firstLessonFree,
    status: 'active' as const,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: existingCourse, error: selectError } = await supabase
      .from('courses')
      .select('id')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      return { success: false, error: selectError.message };
    }

    if (existingCourse?.id) {
      const { error } = await supabase
        .from('courses')
        .update(coursePayload)
        .eq('id', existingCourse.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('courses').insert([coursePayload]);
      if (error) return { success: false, error: error.message };
    }

    await supabase.from('tutors').update({ is_published: true }).eq('id', tutorId);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'courses 寫入失敗';
    return { success: false, error: message };
  }
}

/**
 * 依導師 id 讀取單一公開履歷（Supabase 優先，失敗則 mock）
 */
export async function getTutorById(
  tutorId: string
): Promise<{ tutor: Tutor | null; isFromSupabase: boolean; error?: string }> {
  const mockFallback = () => {
    const mock = MOCK_TUTORS.find((t) => t.id === tutorId) || null;
    return {
      tutor: mock ? redactTutorContact(mock) : null,
      isFromSupabase: false as const,
      error: isSupabaseConfigured ? undefined : 'Supabase 尚未設定，使用示範資料',
    };
  };

  // 示範導師一律用程式名單（避免正式 DB 舊 seed 照片／外師錯置）
  if (isDemoTutorId(tutorId)) {
    return mockFallback();
  }

  // 真實刊登（UUID）一律讀 DB；勿因 USE_MOCK 而找不到自己
  if (!isSupabaseConfigured) {
    return mockFallback();
  }

  try {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', tutorId)
      .maybeSingle();

    if (!error && data) {
      return { tutor: mapDbRowToTutor(data as TutorDbRow), isFromSupabase: true };
    }

    const mock = MOCK_TUTORS.find((t) => t.id === tutorId) || null;
    return {
      tutor: mock,
      isFromSupabase: false,
      error: error?.message,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '連線失敗';
    const mock = MOCK_TUTORS.find((t) => t.id === tutorId) || null;
    return { tutor: mock, isFromSupabase: false, error: message };
  }
}

/**
 * 從 Supabase 讀取真實導師資料（預設只顯示已公開）
 */
export async function getTutors(): Promise<{ tutors: Tutor[]; isFromSupabase: boolean; error?: string }> {
  return searchTutors({ onlyPublished: true, sortBy: 'rating' });
}

/**
 * 進階篩選查詢（時薪／授課方式／排序／地區科目）
 * Supabase 查詢失敗時降級 Mock + 前端過濾
 */
export async function searchTutors(
  filters: TutorSearchFilters = {}
): Promise<{ tutors: Tutor[]; isFromSupabase: boolean; error?: string }> {
  const {
    region = '',
    subject = '',
    q = '',
    mainCategory = '',
    minRate,
    maxRate,
    mode = 'all',
    sortBy = 'recommended',
    onlyPublished = true,
  } = filters;

  const keyword = (q || subject).trim();
  const categoryFilter =
    mainCategory && isMainCategoryKey(mainCategory) ? mainCategory : '';

  const sortTutors = (list: Tutor[]): Tutor[] => {
    const next = [...list];
    next.sort((a, b) => {
      if (sortBy === 'price-asc') return a.hourlyRate - b.hourlyRate;
      if (sortBy === 'price-desc') return b.hourlyRate - a.hourlyRate;
      if (sortBy === 'rating') {
        const byRating = b.reviews.rating - a.reviews.rating;
        if (byRating !== 0) return byRating;
        return b.reviews.reviewCount - a.reviews.reviewCount;
      }
      if (sortBy === 'reviews') {
        const byCount = b.reviews.reviewCount - a.reviews.reviewCount;
        if (byCount !== 0) return byCount;
        return b.reviews.rating - a.reviews.rating;
      }
      if (sortBy === 'popularity') {
        return compareByPopularity(a, b);
      }
      // 精選推薦（預設）：生態平衡綜合分
      return compareByRecommended(a, b);
    });
    return next;
  };

  /**
   * 客戶端篩選。若大類 + 關鍵字／地區互斥導致 0 筆，
   * 依序放寬關鍵字→地區（保留大類與授課方式），避免八大類點進去是空的。
   */
  const applyClientFilters = (list: Tutor[]): Tutor[] => {
    const byCategory = (rows: Tutor[]) =>
      categoryFilter
        ? rows.filter((t) => tutorMatchesMainCategory(t, categoryFilter))
        : rows;

    const byRegion = (rows: Tutor[]) => {
      if (!region.trim()) return rows;
      const rq = region.trim().toLowerCase();
      const short = rq.replace(/(市|縣)$/, '');
      return rows.filter((t) => {
        const blob =
          `${t.location.city}${t.location.district}${t.location.displayLocation}`.toLowerCase();
        return blob.includes(rq) || blob.includes(short);
      });
    };

    const byKeyword = (rows: Tutor[]) =>
      keyword ? rows.filter((t) => tutorMatchesKeyword(t, keyword)) : rows;

    const byRate = (rows: Tutor[]) => {
      let next = rows;
      if (typeof minRate === 'number') {
        next = next.filter((t) => t.hourlyRate >= minRate);
      }
      if (typeof maxRate === 'number') {
        next = next.filter((t) => t.hourlyRate <= maxRate);
      }
      return next;
    };

    const byMode = (rows: Tutor[]) => {
      if (mode !== 'in-person' && mode !== 'online' && mode !== 'hybrid') {
        return rows;
      }
      return rows.filter((t) =>
        tutorMatchesModeFilter(t.teachingModes || [], t.mode, mode)
      );
    };

    const run = (rows: Tutor[], opts: { keyword: boolean; region: boolean }) =>
      byMode(
        byRate(
          (opts.keyword ? byKeyword : (x: Tutor[]) => x)(
            (opts.region ? byRegion : (x: Tutor[]) => x)(byCategory(rows))
          )
        )
      );

    // 候選池：傳入列表 + 示範老師（確保缺類別的 DB 不會讓大類變空）
    const pool = mergeDemoCatalog(list);

    let next = run(pool, { keyword: true, region: true });

    // 有關鍵字（標籤頁／搜尋）時不可丟棄 keyword，否則會顯示無關導師
    if (next.length === 0 && keyword) {
      if (region.trim()) {
        next = run(pool, { keyword: true, region: false });
      }
      if (next.length === 0 && categoryFilter) {
        const catMocks = MOCK_TUTORS.filter(
          (t) =>
            tutorMatchesMainCategory(t, categoryFilter) &&
            tutorMatchesKeyword(t, keyword)
        );
        next = byMode(catMocks);
        if (next.length === 0) next = catMocks;
      }
      return sortTutors(next);
    }

    // 僅大類瀏覽：允許放寬地區／用示範資料填補空類
    if (next.length === 0 && categoryFilter && region.trim()) {
      next = run(pool, { keyword: false, region: false });
    }
    if (next.length === 0 && categoryFilter) {
      const catMocks = MOCK_TUTORS.filter((t) =>
        tutorMatchesMainCategory(t, categoryFilter)
      );
      next = byMode(catMocks);
      // 授課方式也互斥時（例如大類全是線上卻選面授）→ 仍回該大類，避免空白
      if (next.length === 0) next = catMocks;
    }

    return sortTutors(next);
  };

  /**
   * 無 Supabase：純假資料。
   * 有 Supabase：一律讀 DB，再合併示範導師（新照片／人數）；
   * 真實刊登（UUID）永遠保留，不會被 USE_MOCK 蓋掉。
   */
  if (!isSupabaseConfigured) {
    return {
      tutors: applyClientFilters(MOCK_TUTORS).map(redactTutorContact),
      isFromSupabase: false,
      error: 'Supabase 尚未設定，使用示範資料',
    };
  }

  try {
    // 優先走 RPC（pg_trgm tags）；失敗再降級 select
    if (categoryFilter || keyword) {
      const rpcOrTimeout = Promise.race([
        supabase.rpc('search_tutors_catalog', {
          p_main_category: categoryFilter || null,
          p_query: keyword || null,
          p_only_published: onlyPublished,
        }),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: { message: 'Supabase RPC 逾時' } }),
            8000
          )
        ),
      ]);
      const rpcResult = await rpcOrTimeout;
      if (!rpcResult.error && Array.isArray(rpcResult.data)) {
        let mapped = (rpcResult.data as TutorDbRow[]).map((row) =>
          mapDbRowToTutor(row)
        );
        const merged = mergeDemoCatalog(mapped);
        // RPC 已處理分類／關鍵字；其餘篩選仍走 client
        return {
          tutors: applyClientFilters(merged).map(redactTutorContact),
          isFromSupabase: true,
        };
      }
    }

    let query = supabase.from('tutors').select('*');

    if (onlyPublished) {
      query = query.or('is_published.eq.true,is_published.is.null');
    }
    // main_category 過濾交由 client／RPC（欄位遷移前仍相容）
    if (typeof minRate === 'number') query = query.gte('hourly_rate', minRate);
    if (typeof maxRate === 'number') query = query.lte('hourly_rate', maxRate);
    if (mode === 'in-person') query = query.in('mode', ['in-person', 'hybrid']);
    if (mode === 'online') query = query.in('mode', ['online', 'hybrid']);
    if (mode === 'hybrid') query = query.eq('mode', 'hybrid');

    if (sortBy === 'price-asc') {
      query = query.order('hourly_rate', { ascending: true });
    } else if (sortBy === 'price-desc') {
      query = query.order('hourly_rate', { ascending: false });
    } else if (sortBy === 'reviews' || sortBy === 'popularity') {
      query = query
        .order('review_count', { ascending: false })
        .order('rating', { ascending: false });
    } else {
      query = query
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false });
    }

    // 避免本機網路／RLS 卡住導致首頁永遠 loading
    const queryOrTimeout = Promise.race([
      query,
      new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: 'Supabase 查詢逾時' } }),
          8000
        )
      ),
    ]);

    const { data, error } = await queryOrTimeout;

    if (error) {
      console.warn('⚠️ Supabase searchTutors 提示:', error.message);
      return {
        tutors: applyClientFilters(MOCK_TUTORS).map(redactTutorContact),
        isFromSupabase: false,
        error: error.message,
      };
    }

    const mapped = (data || []).map((row) => mapDbRowToTutor(row as TutorDbRow));
    // 示範導師（tutor-*）用程式名單蓋掉舊 seed；真實註冊導師一併保留
    const merged = mergeDemoCatalog(mapped);
    return {
      tutors: applyClientFilters(merged).map(redactTutorContact),
      isFromSupabase: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '連線失敗';
    console.error('⚠️ searchTutors 異常:', err);
    return {
      tutors: applyClientFilters(MOCK_TUTORS).map(redactTutorContact),
      isFromSupabase: false,
      error: message,
    };
  }
}

/** 讀取某導師的 courses 清單 */
export async function getCoursesByTutorId(
  tutorId: string
): Promise<{ courses: TutorCourse[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('updated_at', { ascending: false });

    if (error) {
      return { courses: [], error: error.message };
    }
    return { courses: (data || []).map((row) => mapCourseRow(row as TutorCourseRow)) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '讀取失敗';
    return { courses: [], error: message };
  }
}

export async function updateCourseStatus(
  courseId: string,
  tutorId: string,
  status: CourseStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .eq('tutor_id', tutorId);

    if (error) return { success: false, error: error.message };

    // 同步 tutors.is_published：有任一 active 課程則公開
    const { data: courses } = await supabase
      .from('courses')
      .select('status')
      .eq('tutor_id', tutorId);

    const hasActive = (courses || []).some((c) => (c.status || 'active') === 'active');
    await supabase.from('tutors').update({ is_published: hasActive }).eq('id', tutorId);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : '更新失敗' };
  }
}

export interface CourseEditInput {
  title: string;
  subject: string;
  subjectCategory: string;
  hourlyRate: number;
  description: string;
  mode: TeachingMode;
  city: string;
  district: string;
  firstLessonFree: boolean;
}

/** 後台履歷欄位（含頭像與聯絡方式） */
export interface TutorDashboardProfileInput {
  name: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  specialtyTags: string[];
  subjectCategory: string;
  mainCategory?: MainCategoryKey;
  categoryId?: string;
  youtubeUrl?: string | null;
  clearYoutube?: boolean;
  city: string;
  district: string;
  mode?: TeachingMode;
  teachingModes: TeachingModeOption[];
  hourlyRate: number;
  lineId: string;
  phone: string;
  email?: string;
  firstLessonFree?: boolean;
  freeLessonMinutes?: FreeLessonMinutes;
  responseTime?: string;
}

export async function updateTutorDashboardProfile(
  userId: string,
  input: TutorDashboardProfileInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getTutorProfileByUserId(userId);

    const displayLocation = input.district.trim()
      ? `${input.city.trim()}${input.district.trim()}`
      : input.city.trim();

    const avatarUrl =
      input.avatarUrl.trim() ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name.trim())}&backgroundColor=f9a8d4`;

    const teachingModes = normalizeTeachingModes(
      input.teachingModes,
      input.mode || 'hybrid'
    );
    const mode = deriveLegacyMode(teachingModes);
    const responseTime =
      (input.responseTime && input.responseTime.trim()) || DEFAULT_RESPONSE_TIME;

    const mainCategory = resolveMainCategory({
      mainCategory: input.mainCategory,
      categoryId: input.categoryId,
      subjectCategory: input.subjectCategory,
    });

    const ytResolved = resolveYoutubeForSave(
      input.youtubeUrl,
      existing?.youtubeUrl,
      input.bio,
      input.headline,
      input.clearYoutube
    );
    if (!ytResolved.ok) return { success: false, error: ytResolved.message };

    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      headline: stripExternalLinksFromText(input.headline.trim()).slice(0, 50),
      bio: stripExternalLinksFromText(input.bio.trim()),
      avatar_url: avatarUrl,
      specialty_tags: input.specialtyTags,
      main_category: mainCategory,
      category_id: mainCategory,
      subject_category:
        input.subjectCategory.trim() || mainCategoryLabel(mainCategory),
      city: input.city.trim() || null,
      district: input.district.trim() || null,
      display_location: displayLocation || null,
      mode,
      teaching_modes: teachingModes,
      hourly_rate: input.hourlyRate,
      line_id: input.lineId.trim() || null,
      phone: input.phone.trim() || null,
      email: input.email?.trim() || null,
      first_lesson_free: input.firstLessonFree ?? true,
      free_lesson_minutes: input.freeLessonMinutes ?? 60,
      response_time: responseTime,
      response_speed_minutes: responseTimeToMinutes(responseTime),
      is_published: true,
    };

    const writeResult = await writeTutorRow({
      userId,
      fields: payload,
      mode: 'update',
    });
    if (!writeResult.success) return writeResult;

    const ytPersist = await persistTutorYoutubeUrl(userId, ytResolved.value);
    if (!ytPersist.success) return ytPersist;

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : '更新失敗' };
  }
}

/** 後台新增一筆課程 */
export async function createTutorCourse(
  tutorId: string,
  input: CourseEditInput
): Promise<{ success: boolean; course?: TutorCourse; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([
        {
          tutor_id: tutorId,
          title: input.title.trim(),
          subject: input.subject.trim() || null,
          subject_category: input.subjectCategory.trim() || null,
          hourly_rate: input.hourlyRate,
          description: input.description.trim() || null,
          mode: input.mode,
          region_city: input.city.trim() || null,
          region_district: input.district.trim() || null,
          first_lesson_free: input.firstLessonFree,
          status: 'active',
          updated_at: new Date().toISOString(),
        },
      ])
      .select('*')
      .maybeSingle();

    if (error) return { success: false, error: error.message };

    await supabase.from('tutors').update({ is_published: true }).eq('id', tutorId);

    return {
      success: true,
      course: data ? mapCourseRow(data as TutorCourseRow) : undefined,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : '新增失敗' };
  }
}

export async function updateCourseContent(
  courseId: string,
  tutorId: string,
  input: CourseEditInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('courses')
      .update({
        title: input.title.trim(),
        subject: input.subject.trim() || null,
        subject_category: input.subjectCategory.trim() || null,
        hourly_rate: input.hourlyRate,
        description: input.description.trim() || null,
        mode: input.mode,
        region_city: input.city.trim() || null,
        region_district: input.district.trim() || null,
        first_lesson_free: input.firstLessonFree,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .eq('tutor_id', tutorId);

    if (error) return { success: false, error: error.message };

    // 同步公開履歷主要欄位
    const displayLocation = input.district.trim()
      ? `${input.city.trim()}${input.district.trim()}`
      : input.city.trim();

    await supabase
      .from('tutors')
      .update({
        headline: input.title.trim(),
        bio: input.description.trim(),
        subject_category: input.subjectCategory.trim() || null,
        specialty_tags: input.subject ? [input.subject] : [],
        hourly_rate: input.hourlyRate,
        mode: input.mode,
        city: input.city.trim() || null,
        district: input.district.trim() || null,
        display_location: displayLocation || null,
        first_lesson_free: input.firstLessonFree,
      })
      .eq('id', tutorId);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : '更新失敗' };
  }
}

/** 是否已有導師履歷／課程（Header 顯示管理入口） */
export async function hasTutorListing(userId: string): Promise<boolean> {
  const profile = await getTutorProfileByUserId(userId);
  if (profile) return true;
  const { courses } = await getCoursesByTutorId(userId);
  return courses.length > 0;
}

/**
 * 讀取用戶的解鎖導師清單
 */
export async function getUnlockedTutorIds(buyerId: string = 'student-guest'): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('unlocks')
      .select('tutor_id')
      .eq('buyer_id', buyerId);

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => item.tutor_id);
  } catch (err) {
    console.warn('⚠️ 讀取解鎖紀錄異常:', err);
    return [];
  }
}

/**
 * 確保使用者 Profile 存在（Student Pass 模式；不再使用點數制）
 */
export async function ensureUserProfile(userId: string, email?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ 讀取 Profile 失敗:', error.message);
      return false;
    }

    if (data) return true;

    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: userId, email: email || '' }]);

    if (insertError) {
      console.warn('⚠️ 初始化 Profile 失敗:', insertError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ 讀取 Profile 異常:', err);
    return false;
  }
}
