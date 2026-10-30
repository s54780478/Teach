'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tutor } from '@/types/tutor';
import { X, Check } from 'lucide-react';

interface ContactModalProps {
  tutor: Tutor | null;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ tutor, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'triple'>('single');
  const [paymentMethod, setPaymentMethod] = useState<'linepay' | 'credit' | 'jkopay'>('linepay');
  const [studentName, setStudentName] = useState('');
  const [studentContact, setStudentContact] = useState('');
  const [learningGoal, setLearningGoal] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState('');

  if (!tutor) return null;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      const randomOrder = 'IDT-' + Math.floor(100000 + Math.random() * 900000);
      setOrderNumber(randomOrder);
      setIsProcessing(false);
      setIsUnlocked(true);
    }, 800);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleModalClose = () => {
    setIsUnlocked(false);
    setIsProcessing(false);
    setStudentName('');
    setStudentContact('');
    setLearningGoal('');
    onClose();
  };

  const currentPrice = selectedPlan === 'single' ? 99 : 199;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleModalClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Clean white, high density) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between relative bg-white">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/5 flex-shrink-0">
              <Image
                src={tutor.avatarUrl}
                alt={tutor.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">{tutor.name}</h3>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                  已認證
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5">{tutor.verification.degree}</p>
              <div className="text-[11px] text-slate-400 mt-0.5">
                時薪 NT$ {tutor.hourlyRate.toLocaleString()} · ★ {tutor.reviews.rating.toFixed(1)}
              </div>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            aria-label="關閉"
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {isUnlocked ? (
            /* Result State: Unlocked Contact Details */
            <div className="space-y-4">
              
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950">
                    微付款成功！已解鎖聯絡方式
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {orderNumber}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1 leading-normal">
                  您已獲得 {tutor.name} 導師直接聯絡管道，後續授課學費直接與導師結算，平台絕不抽佣。
                </p>
              </div>

              {/* Direct Contacts List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  導師直接聯繫資料
                </div>

                {/* LINE ID */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">LINE ID</div>
                    <div className="text-xs font-bold text-slate-900 font-mono select-all mt-0.5">
                      {tutor.contact.lineId}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(tutor.contact.lineId, 'line')}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                  >
                    {copiedField === 'line' ? '已複製' : '複製 ID'}
                  </button>
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">電話 / 簡訊</div>
                    <a 
                      href={`tel:${tutor.contact.phone}`}
                      className="text-xs font-bold text-slate-900 font-mono hover:text-brand-500 transition mt-0.5 block"
                    >
                      {tutor.contact.phone}
                    </a>
                  </div>
                  <button
                    onClick={() => handleCopy(tutor.contact.phone, 'phone')}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                  >
                    {copiedField === 'phone' ? '已複製' : '複製電話'}
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">電子信箱</div>
                    <div className="text-xs font-medium text-slate-800 font-mono select-all truncate max-w-[180px] mt-0.5">
                      {tutor.contact.email}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(tutor.contact.email, 'email')}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                  >
                    {copiedField === 'email' ? '已複製' : '複製信箱'}
                  </button>
                </div>
              </div>

              {/* Advice */}
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-normal">
                已同步通知導師。聯繫時請主動提及是透過 <strong>idaltu 平台</strong> 媒合。
                {tutor.firstLessonFree && ' 本導師提供首堂免費試聽，請記得善加利用！'}
              </p>

              <button
                onClick={handleModalClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition text-xs"
              >
                完成並返回列表
              </button>

            </div>
          ) : (
            /* Input State: Single Micro-Payment Unlock Selection */
            <form onSubmit={handlePayment} className="space-y-3.5">
              
              {/* Notice */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 leading-normal">
                <span className="font-bold text-slate-900 block mb-0.5">單次微額解鎖制（免綁約月費）</span>
                只需單次微付款即可解鎖該導師直接聯絡方式。上課鐘點學費 100% 歸導師，平台不抽成。
              </div>

              {/* Plan Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">選擇解鎖方案</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedPlan('single')}
                    className={`cursor-pointer border rounded-xl p-3 transition flex flex-col justify-between ${
                      selectedPlan === 'single'
                        ? 'border-rose-600 bg-rose-50/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">單次解鎖</div>
                      <div className="text-[11px] text-slate-400">解鎖此位導師</div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-rose-600">30 點</span>
                      <span className="text-[10px] text-slate-400 font-normal">(NT$ 99)</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('triple')}
                    className={`cursor-pointer border rounded-xl p-3 transition flex flex-col justify-between relative ${
                      selectedPlan === 'triple'
                        ? 'border-rose-600 bg-rose-50/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 bg-slate-900 text-white text-[9px] font-semibold px-1.5 py-0.2 rounded">
                      推薦
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">3 位解鎖包</div>
                      <div className="text-[11px] text-slate-400">多位導師比較試聽</div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-rose-600">90 點</span>
                      <span className="text-[10px] text-slate-400 font-normal">(NT$ 199)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Fields */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">您的姓名 / 稱呼</label>
                    <input
                      type="text"
                      required
                      placeholder="例：陳同學"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">您的電話或 LINE</label>
                    <input
                      type="text"
                      required
                      placeholder="供導師確認排課"
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">學習需求備註</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="例：目前高二，想加強物理；平日晚上上課..."
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">付款方式（單次結算，不自動扣款）</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('linepay')}
                    className={`py-2 rounded-lg border font-medium transition ${
                      paymentMethod === 'linepay'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    LINE Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-2 rounded-lg border font-medium transition ${
                      paymentMethod === 'credit'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    信用卡
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jkopay')}
                    className={`py-2 rounded-lg border font-medium transition ${
                      paymentMethod === 'jkopay'
                        ? 'border-red-500 bg-red-50/50 text-red-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    街口 / ATM
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-sm disabled:opacity-70"
                >
                  {isProcessing ? '正在安全結算中...' : `立即支付 ${selectedPlan === 'single' ? '30 點 (NT$ 99)' : '90 點 (NT$ 199)'} 解鎖聯絡方式`}
                </button>
                <div className="text-center text-[10px] text-slate-400 mt-1.5">
                  單次微付款結算 · 24 小時未回覆全額退費保證
                </div>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
