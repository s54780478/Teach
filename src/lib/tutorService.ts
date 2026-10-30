import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import type {
  FreeLessonMinutes,
  TeachingMode,
  TeachingModeOption,
  Tutor,
} from '@/types/tutor';
import { MOCK_TUTORS } from '@/data/mockTutors';
import {
  DEFAULT_RESPONSE_TIME,
  deriveLegacyMode,
  minutesToResponseTime,
  normalizeTeachingModes,
  responseTimeToMinutes,
  tutorMatchesModeFilter,
} from '@/lib/teachingModes';

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
  subject?: string;
  minRate?: number;
  maxRate?: number;
  mode?: 'all' | 'in-person' | 'online' | 'hybrid';
  sortBy?: 'recommended' | 'price-asc' | 'price-desc' | 'rating';
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
}

function parseFreeLessonMinutes(raw: unknown): FreeLessonMinutes {
  const n = Number(raw);
  if (n === 30 || n === 45 || n === 60) return n;
  return 60;
}

export function mapDbRowToTutor(row: TutorDbRow): Tutor {
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

  return {
    id: row.id,
    name: row.name,
    headline: (row.headline || '').slice(0, 50),
    bio: row.bio || '',
    avatarUrl:
      row.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    verification: {
      isIdentityVerified: identityVerified,
      isDiplomaVerified: diplomaVerified,
      degree: row.degree || '官方認證學歷',
    },
    isVerified,
    specialtyTags: Array.isArray(row.specialty_tags) ? row.specialty_tags : [],
    subjectCategory: row.subject_category || '未分類',
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
    contact: {
      lineId: row.line_id || '未提供',
      phone: row.phone || '未提供',
      email: row.email || '未提供',
    },
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
    return mapDbRowToTutor(data as TutorDbRow);
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

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name.trim())}&backgroundColor=f9a8d4`;

  const teachingModes = normalizeTeachingModes(
    input.teachingModes,
    input.mode || 'hybrid'
  );
  const mode = deriveLegacyMode(teachingModes);
  const responseTime =
    (input.responseTime && input.responseTime.trim()) || DEFAULT_RESPONSE_TIME;
  const freeLessonMinutes = input.freeLessonMinutes ?? 60;

  const sharedFields = {
    name: input.name.trim(),
    headline: input.headline.trim().slice(0, 50),
    bio: input.bio.trim(),
    degree: input.degree.trim() || null,
    specialty_tags: input.specialtyTags,
    subject_category: input.subjectCategory,
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

  try {
    const existing = await getTutorProfileByUserId(userId);

    if (existing) {
      const { error } = await supabase
        .from('tutors')
        .update(sharedFields)
        .eq('id', userId);

      if (error) {
        console.error('⚠️ 更新導師履歷失敗:', error.message);
        // 若尚未執行 tutor_superprof_fields.sql，降級寫入舊欄位
        if (/teaching_modes|free_lesson_minutes|response_time/i.test(error.message)) {
          const { teaching_modes: _tm, free_lesson_minutes: _fl, response_time: _rt, ...legacy } =
            sharedFields;
          const retry = await supabase.from('tutors').update(legacy).eq('id', userId);
          if (retry.error) return { success: false, error: retry.error.message };
          return { success: true };
        }
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase.from('tutors').insert([
        {
          id: userId,
          ...sharedFields,
          rating: 5.0,
          review_count: 0,
          taught_hours: 0,
          badge: '新星特選',
          is_verified: false,
        },
      ]);

      if (error) {
        console.error('⚠️ 新增導師履歷失敗:', error.message);
        if (/teaching_modes|free_lesson_minutes|response_time/i.test(error.message)) {
          const { teaching_modes: _tm, free_lesson_minutes: _fl, response_time: _rt, ...legacy } =
            sharedFields;
          const retry = await supabase.from('tutors').insert([
            {
              id: userId,
              ...legacy,
              rating: 5.0,
              review_count: 0,
              taught_hours: 0,
              badge: '新星特選',
            },
          ]);
          if (retry.error) return { success: false, error: retry.error.message };
          return { success: true };
        }
        return { success: false, error: error.message };
      }
    }

    // 同步寫入／更新 courses（課程刊登列）；表不存在時不阻斷 tutors 成功
    const courseSync = await upsertTutorCourse(userId, input);
    if (!courseSync.success) {
      console.warn('⚠️ courses 同步提示:', courseSync.error);
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
      tutor: mock,
      isFromSupabase: false as const,
      error: isSupabaseConfigured ? undefined : 'Supabase 尚未設定，使用示範資料',
    };
  };

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
    minRate,
    maxRate,
    mode = 'all',
    sortBy = 'recommended',
    onlyPublished = true,
  } = filters;

  const applyClientFilters = (list: Tutor[]): Tutor[] => {
    let next = [...list];
    if (onlyPublished) {
      // mock 預設皆可視為上架
    }
    if (region.trim()) {
      const q = region.trim().toLowerCase();
      const short = q.replace(/(市|縣)$/, '');
      next = next.filter((t) => {
        const blob = `${t.location.city}${t.location.district}${t.location.displayLocation}`.toLowerCase();
        return blob.includes(q) || blob.includes(short);
      });
    }
    if (subject.trim()) {
      const q = subject.trim().toLowerCase();
      next = next.filter((t) => {
        return (
          t.name.toLowerCase().includes(q) ||
          t.subjectCategory.toLowerCase().includes(q) ||
          t.headline.toLowerCase().includes(q) ||
          t.specialtyTags.some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }
    if (typeof minRate === 'number') next = next.filter((t) => t.hourlyRate >= minRate);
    if (typeof maxRate === 'number') next = next.filter((t) => t.hourlyRate <= maxRate);
    if (mode === 'in-person' || mode === 'online' || mode === 'hybrid') {
      next = next.filter((t) =>
        tutorMatchesModeFilter(t.teachingModes || [], t.mode, mode)
      );
    }

    next.sort((a, b) => {
      if (sortBy === 'rating') return b.reviews.rating - a.reviews.rating;
      if (sortBy === 'price-asc') return a.hourlyRate - b.hourlyRate;
      if (sortBy === 'price-desc') return b.hourlyRate - a.hourlyRate;
      return b.reviews.rating - a.reviews.rating;
    });
    return next;
  };

  if (!isSupabaseConfigured) {
    return {
      tutors: applyClientFilters(MOCK_TUTORS),
      isFromSupabase: false,
      error: 'Supabase 尚未設定，使用示範資料',
    };
  }

  try {
    let query = supabase.from('tutors').select('*');

    if (onlyPublished) {
      query = query.or('is_published.eq.true,is_published.is.null');
    }
    if (typeof minRate === 'number') query = query.gte('hourly_rate', minRate);
    if (typeof maxRate === 'number') query = query.lte('hourly_rate', maxRate);
    if (mode === 'in-person') query = query.in('mode', ['in-person', 'hybrid']);
    if (mode === 'online') query = query.in('mode', ['online', 'hybrid']);
    if (mode === 'hybrid') query = query.eq('mode', 'hybrid');

    if (sortBy === 'price-asc') query = query.order('hourly_rate', { ascending: true });
    else if (sortBy === 'price-desc') query = query.order('hourly_rate', { ascending: false });
    else query = query.order('rating', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.warn('⚠️ Supabase searchTutors 提示:', error.message);
      return {
        tutors: applyClientFilters(MOCK_TUTORS),
        isFromSupabase: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      // 若有篩選條件導致空結果，不要誤用 mock；無任何資料時才降級
      if (!region && !subject && minRate == null && maxRate == null && mode === 'all') {
        return { tutors: applyClientFilters(MOCK_TUTORS), isFromSupabase: false };
      }
      return { tutors: [], isFromSupabase: true };
    }

    // 地區／科目於前端補強（多欄位模糊比對）；時薪／模式已在 SQL 處理，此處只做地區科目與排序
    let mapped = data.map((row) => mapDbRowToTutor(row as TutorDbRow));
    mapped = applyClientFilters(mapped);
    return { tutors: mapped, isFromSupabase: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '連線失敗';
    console.error('⚠️ searchTutors 異常:', err);
    return { tutors: applyClientFilters(MOCK_TUTORS), isFromSupabase: false, error: message };
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

    const payload = {
      name: input.name.trim(),
      headline: input.headline.trim().slice(0, 50),
      bio: input.bio.trim(),
      avatar_url: avatarUrl,
      specialty_tags: input.specialtyTags,
      subject_category: input.subjectCategory.trim() || null,
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

    const { error } = await supabase.from('tutors').update(payload).eq('id', userId);

    if (error) {
      if (/teaching_modes|free_lesson_minutes|response_time/i.test(error.message)) {
        const {
          teaching_modes: _a,
          free_lesson_minutes: _b,
          response_time: _c,
          ...legacy
        } = payload;
        const retry = await supabase.from('tutors').update(legacy).eq('id', userId);
        if (retry.error) return { success: false, error: retry.error.message };
        return { success: true };
      }
      return { success: false, error: error.message };
    }
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
 * 讀取或初始化用戶 Profile 點數
 */
export async function getUserProfile(userId: string, email?: string): Promise<{ points: number }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ 讀取 Profile 失敗:', error.message);
      return { points: 100 };
    }

    if (data) {
      return { points: data.points ?? 100 };
    }

    // 若尚無 profile 紀錄，嘗試自動寫入一筆
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: userId, email: email || '', points: 100 }]);

    if (insertError) {
      console.warn('⚠️ 初始化 Profile 失敗:', insertError.message);
    }

    return { points: 100 };
  } catch (err) {
    console.warn('⚠️ 讀取 Profile 異常:', err);
    return { points: 100 };
  }
}

/**
 * 扣除使用者點數
 */
export async function deductUserPoints(userId: string, newPoints: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId);

    if (error) {
      console.error('⚠️ 扣除點數失敗:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('⚠️ 扣除點數異常:', err);
    return false;
  }
}

/**
 * 將解鎖紀錄寫入 Supabase unlocks 資料表
 */
export async function recordUnlock(
  tutorId: string, 
  buyerId: string, 
  pointsSpent: number = 30
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('unlocks')
      .insert([
        {
          tutor_id: tutorId,
          buyer_id: buyerId,
          points_spent: pointsSpent,
        },
      ]);

    if (error) {
      console.error('⚠️ 寫入 Supabase unlocks 失敗:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('⚠️ 寫入解鎖紀錄異常:', err);
    return { success: false, error: err?.message || '寫入失敗' };
  }
}
