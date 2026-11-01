/**
 * Tag ↔ URL slug（僅 ASCII，利於全球站）。
 * 顯示名可為中文／多語；網址一律英文 kebab-case。
 * 未知標籤走可逆 `t.` + base64url，保證永不出現非 ASCII path。
 */

/** 顯示名 → 英文 slug（小寫 kebab） */
const TAG_TO_SLUG: Record<string, string> = {
  // already Latin
  AI: 'ai',
  'C#': 'csharp',
  ChatGPT: 'chatgpt',
  Excel: 'excel',
  JLPT: 'jlpt',
  Java: 'java',
  N2: 'jlpt-n2',
  'Next.js': 'nextjs',
  Pandas: 'pandas',
  PowerPoint: 'powerpoint',
  Python: 'python',
  React: 'react',
  SQL: 'sql',
  Spring: 'spring',
  TOPIK: 'topik',
  Unity: 'unity',

  // academic / exams
  一對一: 'one-on-one',
  作文: 'essay-writing',
  公民: 'civics',
  分科測驗: 'subject-test',
  分科數學: 'subject-math',
  國中數學: 'junior-math',
  國中理化: 'junior-science',
  國中英文: 'junior-english',
  國中國文: 'junior-chinese',
  國小數學: 'elementary-math',
  國小國語: 'elementary-chinese',
  國小英文: 'elementary-english',
  國小運動: 'elementary-sports',
  國文: 'chinese',
  國文作文: 'chinese-essay',
  學測國文: 'gsat-chinese',
  學測數學: 'gsat-math',
  學測社會: 'gsat-social',
  學測自然: 'gsat-science',
  學測英文: 'gsat-english',
  學測衝刺: 'gsat-prep',
  小論文: 'short-thesis',
  數A: 'math-a',
  數B: 'math-b',
  文言文: 'classical-chinese',
  會考: 'junior-exam',
  會考數學: 'junior-exam-math',
  會考英文: 'junior-exam-english',
  會考衝刺: 'junior-exam-prep',
  模考解題: 'mock-exam',
  理化: 'physics-chemistry',
  生物: 'biology',
  社會科: 'social-studies',
  歷史: 'history',
  地理: 'geography',
  時事: 'current-affairs',
  作業陪讀: 'homework-tutoring',
  高中化學: 'senior-chemistry',
  高中數學: 'senior-math',
  高中物理: 'senior-physics',
  高中英文: 'senior-english',

  // languages
  外語: 'foreign-language',
  多益: 'toeic',
  日文: 'japanese',
  日文會話: 'japanese-conversation',
  文法: 'grammar',
  聽力: 'listening',
  英文: 'english',
  英文作文: 'english-essay',
  英文口說: 'english-speaking',
  英文會話: 'english-conversation',
  商務英文: 'business-english',
  雅思: 'ielts',
  韓文: 'korean',
  韓文會話: 'korean-conversation',
  留學申請: 'study-abroad',
  寫作: 'writing',

  // technology
  作品集: 'portfolio',
  後端: 'backend',
  提示詞: 'prompt-engineering',
  程式: 'programming',
  自動化: 'automation',
  資料分析: 'data-analysis',
  遊戲設計: 'game-design',
  面試題: 'interview-questions',
  報表: 'reporting',
  樞紐分析: 'pivot-tables',

  // arts / music
  低音吉他: 'bass-guitar',
  吉他: 'guitar',
  唱歌: 'singing',
  插畫: 'illustration',
  樂團: 'band',
  流行伴奏: 'pop-accompaniment',
  流行歌唱: 'pop-singing',
  烏克麗麗: 'ukulele',
  發聲: 'vocal-technique',
  素描: 'sketching',
  美術: 'fine-arts',
  自彈自唱: 'sing-and-play',
  貝斯: 'bass',
  鋼琴: 'piano',
  音樂: 'music',

  // sports / fitness
  伸展: 'stretching',
  健身: 'fitness',
  增肌: 'muscle-gain',
  居家運動: 'home-workout',
  投籃: 'shooting',
  有氧舞蹈: 'aerobics-dance',
  減脂: 'fat-loss',
  游泳: 'swimming',
  燃脂: 'fat-burn',
  瑜伽: 'yoga',
  籃球: 'basketball',
  肩頸放鬆: 'neck-shoulder-relief',
  自由式: 'freestyle-swim',
  怕水: 'fear-of-water',
  成人游泳: 'adult-swimming',
  舞蹈: 'dance',
  重訓: 'weight-training',
  體能訓練: 'conditioning',

  // career
  公職: 'civil-service',
  初會: 'intro-accounting',
  口試: 'oral-exam',
  履歷健診: 'resume-review',
  會計: 'accounting',
  簡報: 'presentation',
  職場技能: 'workplace-skills',
  職場溝通: 'workplace-communication',
  職場表達: 'workplace-speaking',
  演說: 'public-speaking',
  行政法: 'admin-law',
  表達: 'expression',
  記帳士: 'bookkeeping-license',
  證照: 'certification',
  轉職: 'career-change',
  面試: 'interview',
  高普考: 'civil-service-exam',

  // lifestyle
  便當: 'bento',
  備餐: 'meal-prep',
  園藝: 'gardening',
  咖啡: 'coffee',
  品鑑: 'tasting',
  多肉: 'succulents',
  家常菜: 'home-cooking',
  布作: 'fabric-crafts',
  手作: 'handmade',
  手沖: 'pour-over',
  拉花入門: 'latte-art-basics',
  改衣: 'clothing-alteration',
  烘焙: 'baking',
  烹飪: 'cooking',
  甜點: 'desserts',
  盆栽: 'potted-plants',
  縫紉: 'sewing',
  蛋糕: 'cake',
  陽台種菜: 'balcony-gardening',
  餅乾: 'cookies',

  // personal development
  人際關係: 'relationships',
  冥想: 'meditation',
  壓力調適: 'stress-management',
  學習計畫: 'study-plan',
  專注力: 'focus',
  情緒管理: 'emotion-regulation',
  時間管理: 'time-management',
  溝通: 'communication',
  溝通技巧: 'communication-skills',
  生產力: 'productivity',
  目標設定: 'goal-setting',
  習慣養成: 'habit-building',
  考試策略: 'exam-strategy',
  自主學習: 'self-learning',
  自我覺察: 'self-awareness',
  衝突處理: 'conflict-resolution',
  讀書方法: 'study-methods',
};

const SLUG_TO_TAG: Record<string, string> = Object.create(null);
for (const [tag, slug] of Object.entries(TAG_TO_SLUG)) {
  // 先登記的優先（避免後面覆寫成較不常見的顯示名）
  if (!SLUG_TO_TAG[slug]) SLUG_TO_TAG[slug] = tag;
}

function utf8ToBase64Url(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToUtf8(slug: string): string {
  const b64 = slug.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const padded = b64 + pad;
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** 已是拉丁文的標籤 → kebab slug */
function slugifyLatin(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[._]+/g, '-')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

function isAsciiSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/**
 * 顯示標籤 → URL 用英文 slug（保證 ASCII）
 */
export function toTagSlug(displayTag: string): string {
  const tag = displayTag.trim();
  if (!tag) return '';

  const mapped = TAG_TO_SLUG[tag];
  if (mapped) return mapped;

  // 全 ASCII／可拉丁化
  if (/^[\x00-\x7F]+$/.test(tag)) {
    const latin = slugifyLatin(tag);
    if (latin && isAsciiSlug(latin)) return latin;
  }

  // 未知多語：可逆 ASCII fallback（全球可用，非 SEO 友好但安全）
  return `t.${utf8ToBase64Url(tag)}`;
}

/**
 * URL slug → 顯示／搜尋用標籤
 * 無法還原時回傳空字串
 */
export function fromTagSlug(slugRaw: string): string {
  let slug = (slugRaw || '').trim();
  if (!slug) return '';
  try {
    slug = decodeURIComponent(slug).trim();
  } catch {
    // keep raw
  }

  const fromAlias = SLUG_TO_TAG[slug.toLowerCase()];
  if (fromAlias) return fromAlias;

  // 容許大小寫變體的拉丁 slug：Python → python
  const lower = slug.toLowerCase();
  if (SLUG_TO_TAG[lower]) return SLUG_TO_TAG[lower];

  if (slug.startsWith('t.')) {
    try {
      return base64UrlToUtf8(slug.slice(2)).trim();
    } catch {
      return '';
    }
  }

  // 純英文 slug 且無別名：用原樣當關鍵字（例：python）
  if (isAsciiSlug(lower)) return lower;

  return '';
}

/** 是否為可接受的 tag path segment（拒絕含非 ASCII 的舊連結可另做 redirect） */
export function isAsciiTagSlug(slug: string): boolean {
  const s = (slug || '').trim();
  if (!s) return false;
  if (s.startsWith('t.')) return /^t\.[A-Za-z0-9_-]+$/.test(s);
  return isAsciiSlug(s.toLowerCase());
}
