import { TW_CITIES } from '@/data/filterOptions';

/** 地區 slug：`all` 或去掉「市／縣」後的名稱（如 台北） */
export function toRegionSlug(cityOrLocation: string): string {
  const raw = cityOrLocation.trim();
  if (!raw || raw === 'all' || raw === '全台' || raw === '全台地區') return 'all';

  const matchedCity = (TW_CITIES as readonly string[]).find(
    (c) => c === raw || c.includes(raw) || raw.includes(c.replace(/(市|縣)$/, ''))
  );
  if (matchedCity) {
    return matchedCity.replace(/(市|縣)$/, '');
  }
  return raw.replace(/(市|縣)$/, '') || raw;
}

/** slug → 完整縣市名（找不到則回傳原字串；all → 空） */
export function fromRegionSlug(slug: string): string {
  const decoded = decodeURIComponent(slug || '').trim();
  if (!decoded || decoded === 'all') return '';

  const hit = (TW_CITIES as readonly string[]).find(
    (c) => c.replace(/(市|縣)$/, '') === decoded || c === decoded
  );
  return hit || decoded;
}

export function toSubjectSlug(subject: string): string {
  const raw = subject.trim();
  if (!raw || raw === 'all' || raw === '全部') return 'all';
  return raw;
}

export function fromSubjectSlug(slug: string): string {
  const decoded = decodeURIComponent(slug || '').trim();
  if (!decoded || decoded === 'all') return '';
  return decoded;
}

/** 組出 `/lessons/{region}/{subject}` */
export function buildLessonsPath(region: string, subject: string): string {
  const r = toRegionSlug(region);
  const s = toSubjectSlug(subject) || 'all';
  return `/lessons/${encodeURIComponent(r)}/${encodeURIComponent(s)}`;
}

export function buildLessonsTitle(regionLabel: string, subjectLabel: string): string {
  const region = regionLabel || '全台';
  const subject = subjectLabel || '熱門';
  return `${region} Top ${subject}家教課程`;
}

export function regionDisplayName(regionSlug: string): string {
  const city = fromRegionSlug(regionSlug);
  if (!city) return '全台';
  return city.replace(/(市|縣)$/, '') || city;
}
