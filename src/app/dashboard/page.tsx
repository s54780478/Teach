import { redirect } from 'next/navigation';

/** 別名：導師後台 → /tutor/dashboard */
export default function DashboardAliasPage() {
  redirect('/tutor/dashboard');
}
