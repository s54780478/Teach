import type { Metadata } from 'next';
import { Inter, Noto_Sans_TC } from 'next/font/google';
import { AppToastHost } from '@/components/AppToastHost';
import './globals.css';

/**
 * 字體策略（皆為開源可商用）：
 * - Inter：接近 Apple SF Pro 的拉丁／數字（OFL）
 * - Noto Sans TC：接近蘋方的繁中（OFL）
 * 不可直接嵌入 Apple 專有 SF Pro／PingFang 檔案。
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansTc = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://idaltu.tw';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'idaltu ｜ 找到最適合你的私人老師',
    template: '%s ｜ idaltu',
  },
  description:
    '探索全台家教課程；老師免費刊登不抽成，學員訂閱 Student Pass 即可聯繫導師。首堂免費試課。',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: 'idaltu',
    title: 'idaltu ｜ 找到最適合你的私人老師',
    description:
      '台灣在地家教與技能媒合。導師免費刊登、學員 Student Pass 解鎖聯繫，平台不抽成鐘點費。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'idaltu ｜ 找到最適合你的私人老師',
    description:
      '台灣在地家教與技能媒合。導師免費刊登、學員 Student Pass 解鎖聯繫。',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={`scroll-smooth ${inter.variable} ${notoSansTc.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-[#1d1d1f] antialiased font-sans selection:bg-brand-500 selection:text-white">
        {children}
        <AppToastHost />
      </body>
    </html>
  );
}
