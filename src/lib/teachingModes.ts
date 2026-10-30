import type { TeachingMode, TeachingModeOption } from '@/types/tutor';

export const DEFAULT_RESPONSE_TIME = '通常在 1 小時內回覆';

export const TEACHING_MODE_OPTIONS: {
  id: TeachingModeOption;
  label: string;
  hint: string;
}[] = [
  { id: 'online', label: '線上授課', hint: 'Online · 視訊一對一' },
  { id: 'in_person', label: '面授／導師指定地點', hint: 'In-person · 咖啡廳或約定地點' },
  { id: 'student_home', label: '可到府授課', hint: "At student's home · 學生府上" },
];

export const FREE_LESSON_MINUTES = [30, 45, 60] as const;
export type FreeLessonMinutes = (typeof FREE_LESSON_MINUTES)[number];

const VALID_MODES = new Set<TeachingModeOption>(['online', 'in_person', 'student_home']);

export function normalizeTeachingModes(
  raw: unknown,
  fallbackMode?: TeachingMode | null
): TeachingModeOption[] {
  if (Array.isArray(raw)) {
    const cleaned = raw
      .map((m) => String(m).trim())
      .filter((m): m is TeachingModeOption => VALID_MODES.has(m as TeachingModeOption));
    if (cleaned.length > 0) return Array.from(new Set(cleaned));
  }
  return modesFromLegacyMode(fallbackMode || 'hybrid');
}

export function modesFromLegacyMode(mode: TeachingMode): TeachingModeOption[] {
  if (mode === 'online') return ['online'];
  if (mode === 'in-person') return ['in_person', 'student_home'];
  return ['online', 'in_person', 'student_home'];
}

/** 由多選授課方式推導舊版 mode（相容既有篩選） */
export function deriveLegacyMode(modes: TeachingModeOption[]): TeachingMode {
  const hasOnline = modes.includes('online');
  const hasInPerson =
    modes.includes('in_person') || modes.includes('student_home');
  if (hasOnline && hasInPerson) return 'hybrid';
  if (hasOnline) return 'online';
  if (hasInPerson) return 'in-person';
  return 'hybrid';
}

export function teachingModeLabels(modes: TeachingModeOption[]): string[] {
  const labels: string[] = [];
  if (modes.includes('online')) labels.push('線上');
  if (modes.includes('in_person')) labels.push('面授');
  if (modes.includes('student_home')) labels.push('可到府');
  return labels.length > 0 ? labels : ['線上'];
}

export function teachingModeShortFromModes(modes: TeachingModeOption[]): string {
  const labels = teachingModeLabels(modes);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}／${labels[1]}`;
  return '線上／面授';
}

export function tutorMatchesModeFilter(
  modes: TeachingModeOption[],
  legacyMode: TeachingMode,
  filter: 'all' | 'in-person' | 'online' | 'hybrid'
): boolean {
  if (filter === 'all') return true;
  const resolved = modes.length > 0 ? modes : modesFromLegacyMode(legacyMode);
  if (filter === 'online') return resolved.includes('online');
  if (filter === 'in-person') {
    return resolved.includes('in_person') || resolved.includes('student_home');
  }
  if (filter === 'hybrid') {
    return (
      resolved.includes('online') &&
      (resolved.includes('in_person') || resolved.includes('student_home'))
    );
  }
  return true;
}

export function minutesToResponseTime(minutes: number): string {
  if (!minutes || minutes <= 0) return DEFAULT_RESPONSE_TIME;
  if (minutes <= 30) return `通常在 ${minutes} 分鐘內回覆`;
  if (minutes <= 60) return '通常在 1 小時內回覆';
  if (minutes <= 180) return '通常在數小時內回覆';
  return `平均約 ${Math.round(minutes / 60)} 小時回覆`;
}

export function responseTimeToMinutes(label: string): number {
  const t = label.trim();
  if (t.includes('數小時')) return 120;
  const minMatch = t.match(/(\d+)\s*分鐘/);
  if (minMatch) return Number(minMatch[1]);
  const hourMatch = t.match(/(\d+)\s*小時/);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  if (t.includes('1 小時') || t.includes('1小時')) return 60;
  return 60;
}
