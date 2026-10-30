import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'idaltu ｜ 找到最適合你的私人老師',
  description:
    '探索全台家教課程；老師可免費刊登課程，家長單次解鎖聯繫。首堂免費試課、不抽成鐘點費。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={`scroll-smooth ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#f7f7f8] text-slate-800 antialiased font-sans selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
