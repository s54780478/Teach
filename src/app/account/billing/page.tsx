'use client';

import React from 'react';
import Link from 'next/link';
import { useStudentPass } from '@/hooks/useStudentPass';
import { formatPassExpiry } from '@/lib/studentPassStorage';

export default function AccountBillingPage() {
  const { studentPass } = useStudentPass();

  const rows =
    studentPass.active && studentPass.activatedAt
      ? [
          {
            id: 'pass',
            label: 'Student Pass 月費',
            date: new Date(studentPass.activatedAt).toLocaleDateString('zh-TW'),
            course: studentPass.planLabel,
            price: '依結帳方案',
          },
        ]
      : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/55">
              <th className="px-5 py-4 font-medium">帳單</th>
              <th className="px-5 py-4 font-medium">日期</th>
              <th className="px-5 py-4 font-medium">課程</th>
              <th className="px-5 py-4 font-medium">價格</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-white/40">
                  尚無帳單紀錄。
                  {!studentPass.active && (
                    <>
                      {' '}
                      <Link href="/account/payments" className="text-[#FF6363] hover:underline">
                        前往開通 Student Pass
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.06]">
                  <td className="px-5 py-4 text-white">{row.label}</td>
                  <td className="px-5 py-4 text-white/70">{row.date}</td>
                  <td className="px-5 py-4 text-white/70">{row.course}</td>
                  <td className="px-5 py-4 text-white/70">{row.price}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {studentPass.active && studentPass.expiresAt && (
        <p className="px-5 py-3 text-xs text-white/40 border-t border-white/10">
          目前通行證有效至 {formatPassExpiry(studentPass.expiresAt)}
        </p>
      )}
    </div>
  );
}
