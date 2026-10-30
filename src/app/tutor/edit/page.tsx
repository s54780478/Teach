import { redirect } from 'next/navigation';

/** 別名：編輯履歷／課程 → /tutor/dashboard */
export default function TutorEditAliasPage() {
  redirect('/tutor/dashboard');
}
