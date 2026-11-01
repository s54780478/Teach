import { MAIN_CATEGORIES } from '@/data/mainCategories';

/** 全台縣市（用於地區篩選） */
export const TW_CITIES = [
  '台北市',
  '新北市',
  '基隆市',
  '桃園市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '台中市',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '台南市',
  '高雄市',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '台東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
] as const;

/** @deprecated 細項改走 Steam 動態 tags；保留相容舊引用 */
export const SUBJECT_QUICK_FILTERS = [
  { id: 'all', label: '全部' },
  { id: '數學', label: '數學' },
  { id: '英文', label: '英文' },
  { id: '國文', label: '國文' },
  { id: '理化', label: '理化' },
  { id: '物理', label: '物理' },
  { id: '化學', label: '化學' },
  { id: '程式', label: '程式' },
  { id: '日文', label: '日文' },
  { id: '韓文', label: '韓文' },
  { id: '音樂', label: '音樂' },
  { id: '鋼琴', label: '鋼琴' },
  { id: '健身', label: '健身' },
] as const;

/** 首頁一級分類：固定 8 大 + 全部 */
export const SUBJECT_CATEGORIES = [
  { id: 'all', label: '全部分類' },
  ...MAIN_CATEGORIES.map((c) => ({ id: c.key, label: c.label })),
] as const;
