'use client';

import React, { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { useStudentPass } from '@/hooks/useStudentPass';
import { StudentPassModal } from '@/components/StudentPassModal';

export default function AccountPaymentsPage() {
  const { studentPass, subscribe, cancelPass } = useStudentPass();
  const [passOpen, setPassOpen] = useState(false);

  return (
    <div className="grid lg:grid-cols-[200px_1fr] gap-4">
      <aside className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-4 h-fit">
        <p className="text-sm font-semibold text-[#FF6363]">付款方式</p>
      </aside>

      <section className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-6 sm:p-8">
        <h1 className="text-xl font-bold">付款方式</h1>
        <p className="mt-2 text-sm text-white/55">
          {studentPass.active
            ? 'Student Pass 已啟用。可於下方管理或續期。'
            : '你需要開通 Student Pass，才能解鎖全台導師聯絡方式。'}
        </p>

        <button
          type="button"
          onClick={() => setPassOpen(true)}
          className="mt-6 w-full flex items-center gap-3 rounded-2xl border border-white/15 bg-[#242426] hover:bg-[#2c2c2e] px-5 py-4 text-left transition cursor-pointer"
        >
          <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FF6363]">
            <CreditCard className="w-5 h-5" />
          </span>
          <span className="flex-1 text-sm font-semibold text-white">
            {studentPass.active ? '管理 Student Pass' : '加入付款方式／開通 Student Pass'}
          </span>
          <Plus className="w-5 h-5 text-white/50" />
        </button>
      </section>

      <StudentPassModal
        isOpen={passOpen}
        pass={studentPass}
        onClose={() => setPassOpen(false)}
        onSubscribe={async (card) => {
          await subscribe(card);
          setPassOpen(false);
        }}
        onCancelPass={() => void cancelPass()}
      />
    </div>
  );
}
