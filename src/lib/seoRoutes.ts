import { TW_CITIES } from '@/data/filterOptions';
import { MAIN_CATEGORIES, MAIN_CATEGORY_LABEL } from '@/data/mainCategories';
import { isMainCategoryKey } from '@/types/mainCategory';
import { fromTagSlug, toTagSlug } from '@/lib/tagSlug';

/** 縣市顯示名 → 英文 slug */
const CITY_TO_SLUG: Record<string, string> = {
  台北市: 'taipei',
  新北市: 'new-taipei',
  基隆市: 'keelung',
  桃園市: 'taoyuan',
  新竹市: 'hsinchu-city',
  新竹縣: 'hsinchu-county',
  苗栗縣: 'miaoli',
  台中市: 'taichung',
  彰化縣: 'changhua',
  南投縣: 'nantou',
  雲林縣: 'yunlin',
  嘉義市: 'chiayi-city',
  嘉義縣: 'chiayi-county',
  台南市: 'tainan',
  高雄市: 'kaohsiung',
  屏東縣: 'pingtung',
  宜蘭縣: 'yilan',
  花蓮縣: 'hualien',
  台東縣: 'taitung',
  澎湖縣: 'penghu',
  金門縣: 'kinmen',
  連江縣: 'lienchiang',
};

const SLUG_TO_CITY: Record<string, string> = Object.create(null);
for (const [city, slug] of Object.entries(CITY_TO_SLUG)) {
  SLUG_TO_CITY[slug] = city;
}

function decodeSegment(raw: string): string {
  const value = (raw || '').trim();
  if (!value) return '';
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value;
  }
}

function isOnlineToken(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v === 'online' ||
    value === '線上' ||
    value === '線上授課' ||
    value === '全台線上'
  );
}

/** 地區 slug：`all`｜`online`｜英文縣市（如 taipei） */
export function toRegionSlug(cityOrLocation: string): string {
  const raw = cityOrLocation.trim();
  if (!raw || raw === 'all' || raw === '全台' || raw === '全台地區') return 'all';
  if (isOnlineToken(raw)) return 'online';

  const lower = raw.toLowerCase();
  if (SLUG_TO_CITY[lower]) return lower;

  const matchedCity = (TW_CITIES as readonly string[]).find(
    (c) =>
      c === raw ||
      c.includes(raw) ||
      raw.includes(c.replace(/(市|縣)$/, ''))
  );
  if (matchedCity && CITY_TO_SLUG[matchedCity]) {
    return CITY_TO_SLUG[matchedCity];
  }

  // 舊中文短名（台北）→ 盡量對到英文
  const byShort = (TW_CITIES as readonly string[]).find(
    (c) => c.replace(/(市|縣)$/, '') === raw
  );
  if (byShort && CITY_TO_SLUG[byShort]) return CITY_TO_SLUG[byShort];

  // 未知：若已是 ASCII kebab 就保留，否則 fallback 避免中文進 URL
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(raw)) return raw.toLowerCase();
  return toTagSlug(raw) || 'all';
}

/**
 * slug → 篩選用字串
 * - all → ''
 * - online → 'online'
 * - taipei → '台北市'
 * - 舊中文 path 仍可解（供 redirect）
 */
export function fromRegionSlug(slug: string): string {
  const decoded = decodeSegment(slug);
  if (!decoded || decoded === 'all') return '';
  if (isOnlineToken(decoded)) return 'online';

  const lower = decoded.toLowerCase();
  if (SLUG_TO_CITY[lower]) return SLUG_TO_CITY[lower];

  const hit = (TW_CITIES as readonly string[]).find(
    (c) => c.replace(/(市|縣)$/, '') === decoded || c === decoded
  );
  return hit || decoded;
}

export function resolveRegionParam(raw: string): {
  query: string;
  canonicalSlug: string;
  needsRedirect: boolean;
} {
  const decoded = decodeSegment(raw);
  if (!decoded || decoded === 'all') {
    return { query: '', canonicalSlug: 'all', needsRedirect: decoded !== 'all' && decoded !== '' };
  }

  const query = fromRegionSlug(decoded);
  const canonicalSlug = toRegionSlug(query || decoded);
  const needsRedirect =
    decoded.toLowerCase() !== canonicalSlug && decoded !== canonicalSlug;
  return { query, canonicalSlug, needsRedirect };
}

export function toSubjectSlug(subject: string): string {
  const raw = subject.trim();
  if (!raw || raw === 'all' || raw === '全部') return 'all';

  if (isMainCategoryKey(raw)) return raw;

  const byLabel = MAIN_CATEGORIES.find((c) => c.label === raw);
  if (byLabel) return byLabel.key;

  return toTagSlug(raw) || 'all';
}

export function fromSubjectSlug(slug: string): string {
  const decoded = decodeSegment(slug);
  if (!decoded || decoded === 'all') return '';

  if (isMainCategoryKey(decoded)) return MAIN_CATEGORY_LABEL[decoded];

  const byLabel = MAIN_CATEGORIES.find((c) => c.label === decoded);
  if (byLabel) return byLabel.label;

  const fromTag = fromTagSlug(decoded);
  if (fromTag) return fromTag;

  // 舊中文 path：直接當顯示／搜尋關鍵字
  return decoded;
}

export function resolveSubjectParam(raw: string): {
  displaySubject: string;
  canonicalSlug: string;
  needsRedirect: boolean;
} {
  const decoded = decodeSegment(raw);
  if (!decoded || decoded === 'all') {
    return {
      displaySubject: '',
      canonicalSlug: 'all',
      needsRedirect: Boolean(decoded) && decoded !== 'all',
    };
  }

  const displaySubject = fromSubjectSlug(decoded);
  const canonicalSlug = toSubjectSlug(displaySubject || decoded);
  const needsRedirect =
    decoded !== canonicalSlug && decoded.toLowerCase() !== canonicalSlug;

  return { displaySubject, canonicalSlug, needsRedirect };
}

/** 組出 `/lessons/{region}/{subject}`（僅 ASCII path） */
export function buildLessonsPath(region: string, subject: string): string {
  const r = toRegionSlug(region);
  const s = toSubjectSlug(subject) || 'all';
  return `/lessons/${r}/${s}`;
}

export function buildLessonsTitle(regionLabel: string, subjectLabel: string): string {
  const region = regionLabel || '全台';
  const subject = subjectLabel || '熱門';
  return `${region} Top ${subject}家教課程`;
}

export function regionDisplayName(regionSlug: string): string {
  if (isOnlineToken(regionSlug) || fromRegionSlug(regionSlug) === 'online') {
    return '線上';
  }
  const city = fromRegionSlug(regionSlug);
  if (!city) return '全台';
  return city.replace(/(市|縣)$/, '') || city;
}
