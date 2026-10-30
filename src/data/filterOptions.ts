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

/** 科目快捷標籤（比對 specialtyTags / 分類 / 標題） */
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
  { id: '音樂', label: '音樂' },
] as const;

export const SUBJECT_CATEGORIES = [
  { id: 'all', label: '全部分類' },
  { id: '數理升學', label: '數理升學' },
  { id: '外語學習', label: '外語學習' },
  { id: '程式設計', label: '程式設計' },
  { id: '音樂藝術', label: '音樂藝術' },
] as const;
