'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';

export default function AccountMessagesPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] overflow-hidden min-h-[480px] grid md:grid-cols-[280px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-white/10 p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 cursor-pointer"
          >
            所有聯絡人
            <ChevronDown className="w-4 h-4" />
          </button>
          <Search className="w-4 h-4 text-white/40" aria-hidden />
        </div>
        <p className="text-sm text-white/40 py-8 text-center">沒有結果。</p>
      </aside>

      <section className="relative p-6 sm:p-8 flex flex-col min-h-[360px]">
        <div>
          <h1 className="text-xl font-bold text-[#5ac8fa]">沒有訊息</h1>
          <p className="mt-3 text-sm text-white/55 max-w-md leading-relaxed">
            你還沒有找到你的老師。透過我們的搜尋找到適合的私人老師，開通 Student Pass
            後即可聯繫。
          </p>
        </div>
        <div className="mt-auto pt-8 flex justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-[#2b7cff] hover:bg-[#3b88ff] text-white text-sm font-semibold transition"
          >
            <Search className="w-4 h-4" />
            尋找老師
          </Link>
        </div>
      </section>
    </div>
  );
}
