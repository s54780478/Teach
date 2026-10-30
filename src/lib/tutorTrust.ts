import type { Tutor } from '@/types/tutor';

export interface TutorTrustFlags {
  identityVerified: boolean;
  diplomaVerified: boolean;
  /** 任一驗證通過 */
  isVerified: boolean;
  /** 平均回覆 ≤ 15 分鐘 */
  fastResponse: boolean;
  /** Super Tutor：金牌／熱門或高評分＋足夠評價數 */
  superTutor: boolean;
  firstLessonFree: boolean;
}

export function getTutorTrustFlags(tutor: Tutor): TutorTrustFlags {
  const identityVerified = Boolean(
    tutor.verification.isIdentityVerified || tutor.isVerified
  );
  const diplomaVerified = Boolean(tutor.verification.isDiplomaVerified);
  const fastResponse =
    tutor.responseSpeedMinutes > 0 && tutor.responseSpeedMinutes <= 15;
  const superTutor =
    tutor.badge === '金牌導師' ||
    tutor.badge === '熱門首選' ||
    (tutor.reviews.rating >= 4.8 && tutor.reviews.reviewCount >= 8);

  return {
    identityVerified,
    diplomaVerified,
    isVerified: identityVerified || diplomaVerified,
    fastResponse,
    superTutor,
    firstLessonFree: Boolean(tutor.firstLessonFree),
  };
}
