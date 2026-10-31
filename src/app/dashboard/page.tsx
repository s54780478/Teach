import { redirect } from 'next/navigation';

/** 舊路徑：會員中心 → /account */
export default function DashboardAliasPage() {
  redirect('/account');
}
