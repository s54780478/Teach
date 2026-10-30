/** 舊版相容：單一 mode（由 teachingModes 推導） */
export type TeachingMode = 'in-person' | 'online' | 'hybrid';

/** Superprof 多選授課方式 */
export type TeachingModeOption = 'online' | 'in_person' | 'student_home';

export type FreeLessonMinutes = 30 | 45 | 60;

export interface VerificationInfo {
  isIdentityVerified: boolean;
  isDiplomaVerified: boolean;
  degree: string;
}

export interface ReviewStats {
  rating: number;
  reviewCount: number;
}

export interface TutorContactDetails {
  phone: string;
  lineId: string;
  email: string;
}

export interface Tutor {
  id: string;
  name: string;
  /** 一句話頭銜（≤50 字） */
  headline: string;
  bio: string;
  avatarUrl: string;
  verification: VerificationInfo;
  /** 綜合驗證標章（身分或學歷任一通過） */
  isVerified: boolean;
  specialtyTags: string[];
  subjectCategory: string;
  location: {
    city: string;
    district: string;
    displayLocation: string;
  };
  /** @deprecated 請優先使用 teachingModes；仍由 modes 推導以相容篩選 */
  mode: TeachingMode;
  /** Superprof：線上／面授／可到府 */
  teachingModes: TeachingModeOption[];
  hourlyRate: number;
  /** free_first_lesson */
  firstLessonFree: boolean;
  /** 免費體驗時長（分鐘） */
  freeLessonMinutes: FreeLessonMinutes;
  /** 顯示用回覆文案，例：通常在 1 小時內回覆 */
  responseTime: string;
  responseSpeedMinutes: number;
  taughtHours?: number;
  reviews: ReviewStats;
  badge?: '熱門首選' | '金牌導師' | '新星特選';
  contact: TutorContactDetails;
}

export interface SearchFilterState {
  subject: string;
  location: string;
  mode: 'all' | 'in-person' | 'online';
}
