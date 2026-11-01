/**
 * YouTube 自我介紹影片：嚴格校驗、解析 video id、產生 embed。
 * 僅允許 YouTube／Shorts 網址，拒絕其他外鏈。
 */

const VIDEO_ID_RE = /^[\w-]{11}$/;

/** 文字欄位中的 URL／疑似連結（用於屏蔽導流） */
const ANY_URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"']+|youtube\.com\/[^\s<>"']+|youtu\.be\/[^\s<>"']+/gi;

export type YoutubeParseResult =
  | { ok: true; videoId: string; canonicalUrl: string; embedUrl: string }
  | { ok: false; message: string };

function normalizeInput(raw: string): string {
  let s = raw.trim();
  if (!s) return '';
  s = s.replace(/^http:\/\//i, 'https://');
  if (!/^https:\/\//i.test(s) && /^(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(s)) {
    s = `https://${s}`;
  }
  return s;
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();

    // youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0] || '';
      return VIDEO_ID_RE.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      // /watch?v=VIDEO_ID
      const v = u.searchParams.get('v');
      if (v && VIDEO_ID_RE.test(v)) return v;

      // /shorts/VIDEO_ID 、 /embed/VIDEO_ID 、 /live/VIDEO_ID
      const parts = u.pathname.split('/').filter(Boolean);
      if (
        parts.length >= 2 &&
        ['shorts', 'embed', 'live', 'v'].includes(parts[0].toLowerCase())
      ) {
        const id = parts[1];
        return VIDEO_ID_RE.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function parseYoutubeUrl(raw: string): YoutubeParseResult {
  if (!raw.trim()) {
    return { ok: false, message: '請貼上 YouTube 網址' };
  }

  const url = normalizeInput(raw);
  const videoId = extractVideoId(url);

  if (!videoId) {
    return {
      ok: false,
      message:
        '僅支援 YouTube 網址：https://www.youtube.com/watch?v=…、https://youtu.be/… 或 Shorts',
    };
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return { ok: true, videoId, canonicalUrl, embedUrl };
}

/** 選填欄位：空字串視為合法（不存影片） */
export function validateOptionalYoutubeUrl(
  raw: string
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!raw.trim()) return { ok: true, value: null };
  const parsed = parseYoutubeUrl(raw);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  return { ok: true, value: parsed.canonicalUrl };
}

export function youtubeEmbedSrc(youtubeUrl: string | null | undefined): string | null {
  if (!youtubeUrl?.trim()) return null;
  const parsed = parseYoutubeUrl(youtubeUrl);
  return parsed.ok ? parsed.embedUrl : null;
}

/**
 * 將文字中的外連／YouTube 連結改為純文字佔位，避免履歷文案導流。
 * 影片只能走 youtube_url 專屬欄位。
 */
export function stripExternalLinksFromText(text: string): string {
  if (!text) return '';
  return text
    .replace(ANY_URL_RE, '[連結已移除・請使用自我介紹影片欄位]')
    .replace(/\s{3,}/g, '  ')
    .trim();
}

/** 從簡介等文字中抓出第一個可解析的 YouTube 網址（貼錯欄位時救援） */
export function extractYoutubeUrlFromText(text: string): string | null {
  if (!text) return null;
  const matches = text.match(ANY_URL_RE);
  if (!matches) return null;
  for (const raw of matches) {
    const parsed = parseYoutubeUrl(raw);
    if (parsed.ok) return parsed.canonicalUrl;
  }
  return null;
}

export const YOUTUBE_POLICY_NOTICE =
  '影片內容（包含畫面、字卡、聲音與影片說明）嚴禁出現個人聯絡方式（如 Line ID、電話、Email、社群帳號）。若經檢舉或系統查獲含有私下聯繫資訊，平台將直接下架該影片或停權帳號，以維護雙方權益。';
