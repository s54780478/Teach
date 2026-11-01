/** 客戶端／伺服端共用：在地補充黑名單（不依賴 npm 套件） */
export const EXTRA_TAG_BLOCKLIST = [
  '色情',
  '性爱',
  '性愛',
  '约炮',
  '約炮',
  '援交',
  '一夜情',
  '色情直播',
  '赌博',
  '賭博',
  '赌场',
  '賭場',
  '博彩',
  '六合彩',
  '退款诈骗',
  '退款詐騙',
  '假钞',
  '假鈔',
  '毒品',
  '大麻',
  '冰毒',
  '海洛因',
  '卖淫',
  '賣淫',
  '嫖娼',
  '洗钱',
  '洗錢',
  '龐氏',
  '庞氏',
  '刷單',
  '刷单',
  '兼职刷单',
  'エロ',
  'アダルト',
  '風俗',
  '援助交際',
  'ギャンブル',
  '성인',
  '도박',
  'crypto pump',
  'forex signal',
  'onlyfans',
  'escort',
] as const;

export function matchesExtraBlocklist(text: string): boolean {
  const c = text.trim().toLowerCase();
  if (!c) return false;
  for (const bad of EXTRA_TAG_BLOCKLIST) {
    const b = bad.toLowerCase();
    if (b.length >= 2 && c.includes(b)) return true;
  }
  return false;
}
