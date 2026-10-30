export type TeachingMode = 'in-person' | 'online' | 'hybrid';

export interface VerificationInfo {
  isIdentityVerified: boolean;
  isDiplomaVerified: boolean;
  degree: string; // e.g. "國立臺灣大學 物理學研究所"
}

export interface ReviewStats {
  rating: number; // e.g. 5.0
  reviewCount: number; // e.g. 38
}

export interface TutorContactDetails {
  phone: string;     // e.g. "0912-345-678"
  lineId: string;    // e.g. "lin_physics_ntu"
  email: string;     // e.g. "chenghan.lin@idaltu.tw"
}

export interface Tutor {
  id: string;
  name: string;
  headline: string; // Superprof style punchy headline
  bio: string;
  avatarUrl: string;
  verification: VerificationInfo;
  specialtyTags: string[]; // e.g. ["國中數學", "台大物理系", "會考衝刺"]
  subjectCategory: string; // e.g. "數理升學", "外語學習", "程式設計"
  location: {
    city: string; // e.g. "台北市"
    district: string; // e.g. "大安區"
    displayLocation: string; // e.g. "台北市大安區"
  };
  mode: TeachingMode;
  hourlyRate: number; // NT$ per hour
  firstLessonFree: boolean; // Superprof signature feature: first lesson free
  responseSpeedMinutes: number; // e.g. 15 (平均 15 分鐘內回覆)
  taughtHours?: number; // e.g. 180 (已授課 180 小時，Superprof 關鍵數據)
  reviews: ReviewStats;
  badge?: '熱門首選' | '金牌導師' | '新星特選';
  contact: TutorContactDetails; // 靜態聯絡方式 (供買方解鎖後展示)
}

export interface SearchFilterState {
  subject: string;
  location: string;
  mode: 'all' | 'in-person' | 'online';
}
