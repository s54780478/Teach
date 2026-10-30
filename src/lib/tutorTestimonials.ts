import type { Tutor } from '@/types/tutor';

export interface TutorTestimonial {
  id: string;
  studentName: string;
  rating: number;
  dateLabel: string;
  content: string;
}

/** 依導師資料產生展示用評價（DB 尚無 reviews 明細時的 Superprof 風格佔位） */
export function buildTutorTestimonials(tutor: Tutor): TutorTestimonial[] {
  const count = Math.min(Math.max(tutor.reviews.reviewCount, 2), 4);
  const templates = [
    `跟${tutor.name}上課後觀念清楚很多，${tutor.specialtyTags[0] || tutor.subjectCategory}進步明顯，也很有耐心。`,
    `教學節奏穩定、重點清楚。約在${tutor.location.district || tutor.location.city}上課很方便，推薦給需要穩扎穩打的學生。`,
    `首堂試聽就決定繼續！會針對弱點客製練習，回覆也很快（約 ${tutor.responseSpeedMinutes} 分鐘內）。`,
    `${tutor.verification.degree}背景很扎實，解說淺顯易懂，孩子上課意願明顯提高。`,
  ];

  const names = ['王媽媽', '陳同學', '林家長', '張同學', '黃小姐', '劉同學'];

  return Array.from({ length: count }, (_, i) => ({
    id: `${tutor.id}-review-${i + 1}`,
    studentName: names[i % names.length],
    rating: Math.max(4, Math.round(tutor.reviews.rating)),
    dateLabel: `${2 + i} 個月前`,
    content: templates[i % templates.length],
  }));
}

export function teachingModeDetails(mode: Tutor['mode']): {
  title: string;
  items: string[];
} {
  if (mode === 'online') {
    return {
      title: '線上視訊為主',
      items: ['高清線上視訊一對一', '彈性排課、全台皆可', '電子講義與課後複習'],
    };
  }
  if (mode === 'in-person') {
    return {
      title: '實體面授為主',
      items: ['一對一到府／咖啡廳', '學生府上面授', '實體板書與即時互動'],
    };
  }
  return {
    title: '實體與線上皆可',
    items: ['一對一到府或咖啡廳', '高清線上視訊教學', '學生府上／約定地點面授'],
  };
}
