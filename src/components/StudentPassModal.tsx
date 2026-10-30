'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Loader2,
  Infinity,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Lock,
} from 'lucide-react';
import type { StudentPassState } from '@/lib/studentPassStorage';
import { formatPassExpiry } from '@/lib/studentPassStorage';
import {
  fetchPaymentConfig,
  type NewebpayCardInput,
} from '@/lib/subscriptionService';

interface StudentPassModalProps {
  isOpen: boolean;
  pass: StudentPassState;
  onClose: () => void;
  /** 藍新直刷（帶卡）／演示開通／定期定額 */
  onSubscribe: (card?: NewebpayCardInput) => Promise<void> | void;
  onCancelPass?: () => void;
  /** 從「聯絡老師」進入時顯示目標導師 */
  tutorName?: string | null;
}

const BENEFITS = [
  { icon: Infinity, title: '無限次聯繫全台導師', desc: '訂閱期間不限次數查看 LINE／電話' },
  { icon: MessageCircle, title: '直接開聊排課', desc: '學費與導師私下結算，平台不抽成鐘點費' },
  { icon: ShieldCheck, title: '驗證師資更安心', desc: '優先聯繫身份／學歷已驗證與超快回覆導師' },
];

export const StudentPassModal: React.FC<StudentPassModalProps> = ({
  isOpen,
  pass,
  onClose,
  onSubscribe,
  onCancelPass,
  tutorName = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfigured, setPaymentConfigured] = useState(false);
  const [supportsCardForm, setSupportsCardForm] = useState(false);
  const [amount, setAmount] = useState(499);
  const [error, setError] = useState<string | null>(null);
  const [payMode, setPayMode] = useState<'card' | 'period'>('card');

  const [cardNo, setCardNo] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    void fetchPaymentConfig().then((cfg) => {
      setPaymentConfigured(cfg.paymentConfigured);
      setSupportsCardForm(Boolean(cfg.supportsCardForm));
      setAmount(cfg.amount || 499);
      setPayMode(cfg.supportsCardForm ? 'card' : 'period');
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCardDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleSubscribe = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (paymentConfigured && supportsCardForm && payMode === 'card') {
        const card: NewebpayCardInput = {
          cardNo: cardNo.replace(/\s+/g, ''),
          expMonth,
          expYear,
          cvc,
        };
        if (card.cardNo.length < 13 || !expMonth || !expYear || cvc.length < 3) {
          setError('請完整填寫信用卡資訊');
          setIsSubmitting(false);
          return;
        }
        await onSubscribe(card);
      } else if (paymentConfigured && payMode === 'period') {
        // 定期定額：不帶卡號，由藍新付款頁收集
        await onSubscribe(undefined);
      } else {
        // 演示開通
        await onSubscribe(undefined);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '結帳失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-pass-title"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-50 to-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="student-pass-title" className="text-base font-bold text-slate-900">
                Student Pass
              </h3>
              <p className="text-[11px] text-slate-500">學生通行證 · 藍新金流月費訂閱</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!pass.active && tutorName && (
            <div className="rounded-xl bg-brand-50 border border-brand-200/70 px-4 py-3 flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-brand-800 leading-relaxed">
                即將聯繫 <strong>{tutorName}</strong>
                。開通 Student Pass 後即可查看 LINE／電話並直接排課。
              </p>
            </div>
          )}

          {pass.active ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 px-4 py-3">
              <p className="text-sm font-bold text-emerald-800">您的 Student Pass 已啟用</p>
              <p className="text-xs text-emerald-700/80 mt-1">
                有效至 {formatPassExpiry(pass.expiresAt)} · 可無限次解鎖全台導師聯絡方式
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                訂閱 Student Pass，即可無限次聯繫全台導師
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {paymentConfigured
                  ? '透過藍新金流安全刷卡；授權成功後立即開通並寫入訂閱狀態。'
                  : '目前為演示模式（尚未設定藍新 HashKey／HashIV），可一鍵寫入 subscriptions。'}
              </p>
            </div>
          )}

          <ul className="space-y-2.5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.title}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {!pass.active && (
            <div className="rounded-xl border border-slate-200 p-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  {paymentConfigured ? '月費方案（藍新）' : '演示模式（金流 Key 未設定）'}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  NT$ {amount.toLocaleString()}
                  <span className="text-sm font-semibold text-slate-400">/月</span>
                </p>
              </div>
              <p className="text-[11px] text-slate-400 text-right leading-snug">
                {paymentConfigured ? (
                  <>
                    手續費約 2.4%~2.8%
                    <br />
                    公司戶／免年費
                  </>
                ) : (
                  <>
                    一鍵演示開通
                    <br />
                    寫入 subscriptions
                  </>
                )}
              </p>
            </div>
          )}

          {!pass.active && paymentConfigured && supportsCardForm && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-brand-500" />
                  信用卡付款
                </p>
                <div className="flex rounded-full bg-white border border-slate-200 p-0.5 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPayMode('card')}
                    className={`px-2.5 py-1 rounded-full cursor-pointer transition ${
                      payMode === 'card' ? 'bg-brand-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    站內直刷
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('period')}
                    className={`px-2.5 py-1 rounded-full cursor-pointer transition ${
                      payMode === 'period' ? 'bg-brand-500 text-white' : 'text-slate-500'
                    }`}
                  >
                    定期定額
                  </button>
                </div>
              </div>

              {payMode === 'card' ? (
                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="sp-card-no" className="block text-[11px] font-medium text-slate-500 mb-1">
                      卡號
                    </label>
                    <input
                      id="sp-card-no"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="ACCT-000003"
                      value={formatCardDisplay(cardNo)}
                      onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="sp-exp-m" className="block text-[11px] font-medium text-slate-500 mb-1">
                        月
                      </label>
                      <input
                        id="sp-exp-m"
                        inputMode="numeric"
                        autoComplete="cc-exp-month"
                        placeholder="MM"
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    <div>
                      <label htmlFor="sp-exp-y" className="block text-[11px] font-medium text-slate-500 mb-1">
                        年
                      </label>
                      <input
                        id="sp-exp-y"
                        inputMode="numeric"
                        autoComplete="cc-exp-year"
                        placeholder="YY"
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    <div>
                      <label htmlFor="sp-cvc" className="block text-[11px] font-medium text-slate-500 mb-1">
                        CVC
                      </label>
                      <input
                        id="sp-cvc"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    經藍新 AES 加密傳輸 · CheckCode 驗證授權結果
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  將導向藍新「定期定額」付款頁完成首期授權，之後依排程自動扣款；成功後由 Notify 更新訂閱。
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:justify-end sticky bottom-0">
          {pass.active ? (
            <>
              {onCancelPass && (
                <button
                  type="button"
                  onClick={onCancelPass}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  取消訂閱
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                開始聯繫導師
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition cursor-pointer"
              >
                稍後再說
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSubscribe()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-full transition disabled:opacity-60 cursor-pointer shadow-sm shadow-brand-500/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : paymentConfigured ? (
                  <CreditCard className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isSubmitting
                  ? paymentConfigured
                    ? payMode === 'period'
                      ? '導向藍新…'
                      : '授權中…'
                    : '開通中…'
                  : paymentConfigured
                    ? payMode === 'period'
                      ? '前往定期定額'
                      : '信用卡付款開通'
                    : '演示開通 Student Pass'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
