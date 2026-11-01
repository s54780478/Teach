import type { Tutor } from '@/types/tutor';

/**
 * 排序分數（0～100 左右；僅相對大小有意義）
 *
 * 熱門程度 ≈ 短期動態行為
 * 精選推薦 ≈ Preply 式生態平衡（完整度／可約性／留存／新師加成）
 *
 * 尚未有真實埋點時，用既有欄位當代理變數；日後可換成 DB 事件表。
 */

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** 穩定偽隨機 0～1（同 id 同結果，避免每次重整順序亂跳） */
function stableUnit(id: string, salt = 0): number {
  let h = salt >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x9e3779b1);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function hasIntroVideo(tutor: Tutor): boolean {
  return Boolean(tutor.youtubeUrl && String(tutor.youtubeUrl).trim());
}

/** 近期預約量代理：授課時數＋評論動能（正規化） */
function recentBookingProxy(tutor: Tutor): number {
  const hours = Math.min(tutor.taughtHours ?? 0, 600) / 600;
  const reviews = Math.min(tutor.reviews.reviewCount, 80) / 80;
  return clamp01(0.55 * hours + 0.45 * reviews);
}

/**
 * 瀏覽轉換率代理：高評分 × log(評論)
 * （真轉換＝預約／瀏覽；此處用「看過的人願意留下評價」近似）
 */
function browseConversionProxy(tutor: Tutor): number {
  const ratingN = clamp01(tutor.reviews.rating / 5);
  const volume = Math.log1p(tutor.reviews.reviewCount) / Math.log1p(80);
  return clamp01(0.65 * ratingN + 0.35 * volume);
}

/** 訊息回覆速度：分鐘愈短分數愈高 */
function replySpeedProxy(tutor: Tutor): number {
  const m = Math.max(1, tutor.responseSpeedMinutes || 120);
  // ≤15 分接近滿分；≥4 小時接近 0
  return clamp01(1 - (m - 5) / 240);
}

/**
 * 熱門程度 Score =
 *   w1×近期預約量 + w2×瀏覽轉換率 + w3×訊息回覆速度
 */
export function computePopularityScore(tutor: Tutor): number {
  const w1 = 0.45;
  const w2 = 0.35;
  const w3 = 0.2;
  const raw =
    w1 * recentBookingProxy(tutor) +
    w2 * browseConversionProxy(tutor) +
    w3 * replySpeedProxy(tutor);

  // 平台標章微調（熱門首選略加權）
  const badgeBoost =
    tutor.badge === '熱門首選' ? 0.06 : tutor.badge === '金牌導師' ? 0.03 : 0;

  return (raw + badgeBoost) * 100;
}

/** 履歷完整度：影片／標籤／驗證／文案 */
function profileCompleteness(tutor: Tutor): number {
  const tags = tutor.specialtyTags?.length ?? 0;
  const tagScore = clamp01(tags / 5);
  const bioLen = (tutor.bio || '').trim().length;
  const headlineLen = (tutor.headline || '').trim().length;

  return clamp01(
    (hasIntroVideo(tutor) ? 0.35 : 0) +
      tagScore * 0.25 +
      (tutor.isVerified ||
      tutor.verification.isIdentityVerified ||
      tutor.verification.isDiplomaVerified
        ? 0.2
        : 0) +
      (bioLen >= 80 ? 0.12 : bioLen >= 30 ? 0.06 : 0) +
      (headlineLen >= 8 ? 0.08 : 0)
  );
}

/**
 * 時間表可排性代理：授課方式多元＋首堂免費＋線上可約
 * （尚無真實時段表時，用「學生約得到的機會」近似）
 */
function availabilityProxy(tutor: Tutor): number {
  const modes = tutor.teachingModes?.length ?? 0;
  const modeScore = clamp01(modes / 3);
  const onlineBoost = tutor.teachingModes?.includes('online') ? 0.15 : 0;
  const freeBoost = tutor.firstLessonFree ? 0.2 : 0;
  return clamp01(0.65 * modeScore + onlineBoost + freeBoost);
}

/**
 * 學員留存代理：足夠樣本下的高評分＝試聽後願意留下
 * 樣本不足時降權，避免 5.0／0 則灌水
 */
function retentionProxy(tutor: Tutor): number {
  const ratingN = clamp01(tutor.reviews.rating / 5);
  const n = tutor.reviews.reviewCount;
  if (n >= 20) return ratingN;
  if (n >= 8) return ratingN * 0.85;
  if (n >= 3) return ratingN * 0.55;
  return ratingN * 0.25;
}

/**
 * 冷啟動保護：新星／低評價數但素質不錯 → 穩定隨機短期加成
 * 避免強者恆強、新師永遠沒曝光
 */
function newTutorBoost(tutor: Tutor): number {
  const n = tutor.reviews.reviewCount;
  const good = tutor.reviews.rating >= 4.7;
  const rnd = stableUnit(tutor.id, 7);

  if (tutor.badge === '新星特選') {
    return 0.18 + 0.12 * rnd;
  }
  if (n < 5 && good) {
    return 0.1 + 0.1 * rnd;
  }
  if (n < 12 && good) {
    return 0.04 + 0.06 * rnd;
  }
  return 0;
}

/**
 * 精選推薦（預設）：平台成交／留存／生態平衡
 * 權重：完整度 + 可約性 + 留存 + 新師加成 + 輕量品質底分
 */
export function computeRecommendedScore(tutor: Tutor): number {
  const completeness = profileCompleteness(tutor);
  const availability = availabilityProxy(tutor);
  const retention = retentionProxy(tutor);
  const coldStart = newTutorBoost(tutor);
  const qualityFloor = browseConversionProxy(tutor) * 0.15;
  const reply = replySpeedProxy(tutor) * 0.08;

  const badgeBoost =
    tutor.badge === '金牌導師'
      ? 0.05
      : tutor.badge === '熱門首選'
        ? 0.04
        : 0;

  const raw =
    0.28 * completeness +
    0.22 * availability +
    0.27 * retention +
    coldStart +
    qualityFloor +
    reply +
    badgeBoost;

  return raw * 100;
}

export function compareByPopularity(a: Tutor, b: Tutor): number {
  const d = computePopularityScore(b) - computePopularityScore(a);
  if (d !== 0) return d;
  return b.reviews.reviewCount - a.reviews.reviewCount;
}

export function compareByRecommended(a: Tutor, b: Tutor): number {
  const d = computeRecommendedScore(b) - computeRecommendedScore(a);
  if (d !== 0) return d;
  const byRating = b.reviews.rating - a.reviews.rating;
  if (byRating !== 0) return byRating;
  return b.reviews.reviewCount - a.reviews.reviewCount;
}
