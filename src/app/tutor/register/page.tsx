import { redirect } from 'next/navigation';

/** Superprof 用語別名：刊登廣告／註冊導向既有申請表單 */
export default function TutorRegisterRedirectPage() {
  redirect('/tutor/apply');
}
