/** 聯繫／預約 → Auth → Student Pass 三入口共用文案 */

export function authIntentForTutor(tutorName: string): string {
  return `登入後開通 Student Pass，即可聯繫「${tutorName}」（解鎖全平台、可隨時取消）。`;
}

export const PASS_UNLOCK_HINT =
  '開通 Student Pass 可解鎖全平台導師聯繫權限 · 可隨時取消';

export const CARD_PASS_HINT = '需 Student Pass 才能查看 LINE／電話';
