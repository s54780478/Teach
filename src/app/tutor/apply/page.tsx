'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import {
  getTutorProfileByUserId,
  upsertTutorProfile,
} from '@/lib/tutorService';
import type { TeachingMode } from '@/types/tutor';
import { AuthModal } from '@/components/AuthModal';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserRound,
  BookOpen,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: '基本資料', icon: UserRound },
  { id: 2, title: '授課設定', icon: MapPin },
  { id: 3, title: '聯絡方式', icon: Phone },
] as const;

const SUBJECT_CATEGORIES = [
  '數理升學',
  '外語學習',
  '程式設計',
  '音樂藝術',
  '體育運動',
  '語文寫作',
  '商業金融',
  '其他',
];

const TEACHING_MODES: { value: TeachingMode; label: string; hint: string }[] = [
  { value: 'in-person', label: '實體到府', hint: '家裡／咖啡廳面授' },
  { value: 'online', label: '線上遠距', hint: '視訊高清上課' },
  { value: 'hybrid', label: '實體 + 線上', hint: '兩種皆可' },
];

/** 台灣升學／在地常用科目標籤 */
const TW_SUBJECT_TAGS = [
  '中壢高中數學',
  '國中理化',
  '國中數學',
  '高中物理',
  '高中化學',
  '學測英文',
  '學測國文',
  '分科測驗',
  '會考衝刺',
  '國小作文',
  '雅思口說',
  '多益900+',
  'JLPT 日文',
  'Python 入門',
  '家教到府',
  '一對一',
];

interface FormState {
  name: string;
  headline: string;
  subjectCategory: string;
  specialtyTags: string[];
  city: string;
  district: string;
  mode: TeachingMode;
  hourlyRate: string;
  firstLessonFree: boolean;
  bio: string;
  degree: string;
  lineId: string;
  phone: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  headline: '',
  subjectCategory: '數理升學',
  specialtyTags: [],
  city: '',
  district: '',
  mode: 'hybrid',
  hourlyRate: '',
  firstLessonFree: true,
  bio: '',
  degree: '',
  lineId: '',
  phone: '',
};

type FieldKey = keyof FormState;

export default function TutorApplyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadExistingProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const existing = await getTutorProfileByUserId(userId);
      if (!existing) return;
      setIsEditMode(true);
      setForm({
        name: existing.name,
        headline: existing.headline,
        subjectCategory: existing.subjectCategory || '數理升學',
        specialtyTags: existing.specialtyTags || [],
        city: existing.location.city,
        district: existing.location.district,
        mode: existing.mode,
        hourlyRate: String(existing.hourlyRate || ''),
        firstLessonFree: existing.firstLessonFree,
        bio: existing.bio,
        degree: existing.verification.degree || '',
        lineId: existing.contact.lineId === '未提供' ? '' : existing.contact.lineId,
        phone: existing.contact.phone === '未提供' ? '' : existing.contact.phone,
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      void loadExistingProfile(user.id);
    }
  }, [user?.id, loadExistingProfile]);

  const setField = <K extends FieldKey>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      specialtyTags: prev.specialtyTags.includes(tag)
        ? prev.specialtyTags.filter((t) => t !== tag)
        : [...prev.specialtyTags, tag],
    }));
  };

  const addCustomTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.specialtyTags.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        specialtyTags: [...prev.specialtyTags, trimmed],
      }));
    }
    setTagInput('');
  };

  const validateStep = (currentStep: number): boolean => {
    const errors: Partial<Record<FieldKey, string>> = {};

    if (currentStep === 1) {
      if (!form.name.trim()) errors.name = '請填寫真實姓名或稱呼';
      if (form.specialtyTags.length === 0) {
        errors.specialtyTags = '請至少選擇或新增一個教授科目';
      }
    }

    if (currentStep === 2) {
      if (!form.city.trim()) errors.city = '請填寫服務縣市（例：桃園市）';
      if (!form.hourlyRate.trim()) {
        errors.hourlyRate = '請填寫時薪';
      } else if (Number.isNaN(Number(form.hourlyRate)) || Number(form.hourlyRate) < 100) {
        errors.hourlyRate = '時薪需為數字且至少 100 元';
      }
      if (!form.headline.trim() && !form.bio.trim()) {
        // auto-generate headline later; bio optional but encourage
      }
    }

    if (currentStep === 3) {
      if (!form.lineId.trim() && !form.phone.trim()) {
        errors.lineId = '請至少填寫 LINE ID 或電話其一';
        errors.phone = '請至少填寫 LINE ID 或電話其一';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const buildHeadline = (): string => {
    if (form.headline.trim()) return form.headline.trim();
    const tags = form.specialtyTags.slice(0, 2).join('・');
    const loc = form.district.trim()
      ? `${form.city.trim()}${form.district.trim()}`
      : form.city.trim();
    return [tags || form.subjectCategory, loc].filter(Boolean).join(' ｜ ');
  };

  const buildBio = (): string => {
    if (form.bio.trim()) return form.bio.trim();
    const modeLabel =
      TEACHING_MODES.find((m) => m.value === form.mode)?.label || '彈性授課';
    return `專長：${form.specialtyTags.join('、') || form.subjectCategory}。授課方式：${modeLabel}。歡迎家長解鎖後聯繫排課。`;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await upsertTutorProfile(user.id, {
      name: form.name.trim(),
      headline: buildHeadline(),
      bio: buildBio(),
      degree: form.degree.trim(),
      specialtyTags: form.specialtyTags,
      subjectCategory: form.subjectCategory,
      city: form.city.trim(),
      district: form.district.trim(),
      mode: form.mode,
      hourlyRate: Number(form.hourlyRate),
      firstLessonFree: form.firstLessonFree,
      lineId: form.lineId.trim(),
      phone: form.phone.trim(),
      email: user.email || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error || '送出失敗，請稍後再試');
      return;
    }

    setSubmitSuccess(true);
  };

  const inputClass = (hasError?: string) =>
    `w-full text-sm px-3.5 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition ${
      hasError ? 'border-rose-400' : 'border-slate-200'
    }`;

  // ── Loading ──
  if (!authChecked || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  // ── 未登入閘道（本頁直接登入，不靜默踢回首頁）──
  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <ApplyTopBar />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Sparkles className="w-10 h-10 text-brand-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">免費刊登您的家教廣告</h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              建立一頁公開的家教課程廣告，吸引學生主動聯繫・平台不抽成鐘點費。請先登入，以便將廣告綁定您的帳號。
            </p>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center justify-center w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm py-3 rounded-xl transition cursor-pointer"
            >
              登入後開始刊登
            </button>
            <Link href="/" className="inline-block text-xs text-slate-400 hover:text-slate-600 mt-4 transition">
              先回首頁逛逛
            </Link>
          </div>
        </main>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  // ── 成功頁 ──
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <ApplyTopBar />
        <main className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {isEditMode ? '廣告已更新！' : '您的家教廣告已刊登！'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              家長可瀏覽您的公開課程頁，並透過<strong className="text-slate-900">單次微付款解鎖</strong>聯絡方式。
            </p>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">
              鐘點費 100% 歸您所有・idaltu 不抽成仲介費・聯絡資訊僅在學員解鎖後顯示
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm py-3 rounded-xl transition"
              >
                回首頁查看廣告
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setStep(1);
                  setIsEditMode(true);
                }}
                className="flex-1 inline-flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-3 rounded-xl transition cursor-pointer"
              >
                繼續編輯廣告
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <ApplyTopBar title={isEditMode ? '編輯廣告' : '刊登課程'} />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? '更新您的家教廣告' : '刊登您的家教課程'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            建立公開的家教廣告頁面，吸引學生主動聯繫・免費刊登、不抽成鐘點費
          </p>
        </div>

        {/* Step indicator */}
        <nav aria-label="刊登步驟" className="mb-6">
          <ol className="flex items-center gap-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <li key={s.id} className="flex items-center flex-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id < step) setStep(s.id);
                    }}
                    className={`flex items-center gap-2 min-w-0 ${
                      s.id <= step ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span
                      className={`hidden sm:block text-xs font-semibold truncate ${
                        active ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded ${
                        step > s.id ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Form card — 置頂互動 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
          {/* Step 1 */}
          {step === 1 && (
            <section className="space-y-5" aria-labelledby="step1-title">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-brand-500" />
                <h2 id="step1-title" className="text-sm font-bold text-slate-900">
                  步驟 1 · 你是誰、教什麼
                </h2>
              </div>

              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1.5">
                  真實姓名 / 稱呼 <span className="text-brand-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="例：王小明、Brian 老師"
                  className={inputClass(fieldErrors.name)}
                  autoFocus
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="subjectCategory" className="block text-xs font-medium text-slate-700 mb-1.5">
                  主要科目分類
                </label>
                <select
                  id="subjectCategory"
                  value={form.subjectCategory}
                  onChange={(e) => setField('subjectCategory', e.target.value)}
                  className={inputClass()}
                >
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="block text-xs font-medium text-slate-700 mb-1.5">
                  教授科目（台灣升學標籤） <span className="text-brand-500">*</span>
                </p>
                <p className="text-[11px] text-slate-400 mb-2">
                  點選標籤，或自行輸入如「中壢高中數學」後按 Enter
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TW_SUBJECT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        form.specialtyTags.includes(tag)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    placeholder="自訂科目，按 Enter 新增"
                    className={`flex-1 ${inputClass()}`}
                    aria-label="自訂教授科目"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                  >
                    新增
                  </button>
                </div>
                {fieldErrors.specialtyTags && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.specialtyTags}</p>
                )}
                {form.specialtyTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {form.specialtyTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-rose-700 border border-rose-200/60 px-2.5 py-1 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="font-bold leading-none cursor-pointer"
                          aria-label={`移除 ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="degree" className="block text-xs font-medium text-slate-700 mb-1.5">
                  學歷 / 證照（選填）
                </label>
                <input
                  id="degree"
                  type="text"
                  value={form.degree}
                  onChange={(e) => setField('degree', e.target.value)}
                  placeholder="例：國立台灣大學 電機工程學系"
                  className={inputClass()}
                />
              </div>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className="space-y-5" aria-labelledby="step2-title">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-brand-500" />
                <h2 id="step2-title" className="text-sm font-bold text-slate-900">
                  步驟 2 · 怎麼教、在哪教、多少錢
                </h2>
              </div>

              <div>
                <p className="block text-xs font-medium text-slate-700 mb-2">
                  授課方式 <span className="text-brand-500">*</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TEACHING_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setField('mode', m.value)}
                      className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                        form.mode === m.value
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{m.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-slate-700 mb-1.5">
                    服務縣市 <span className="text-brand-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="例：桃園市"
                    className={inputClass(fieldErrors.city)}
                  />
                  {fieldErrors.city && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.city}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="district" className="block text-xs font-medium text-slate-700 mb-1.5">
                    行政區
                  </label>
                  <input
                    id="district"
                    type="text"
                    value={form.district}
                    onChange={(e) => setField('district', e.target.value)}
                    placeholder="例：中壢區"
                    className={inputClass()}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hourlyRate" className="block text-xs font-medium text-slate-700 mb-1.5">
                  時薪 (NT$/hr) <span className="text-brand-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    NT$
                  </span>
                  <input
                    id="hourlyRate"
                    type="number"
                    min={100}
                    step={50}
                    value={form.hourlyRate}
                    onChange={(e) => setField('hourlyRate', e.target.value)}
                    placeholder="600"
                    className={`${inputClass(fieldErrors.hourlyRate)} pl-12`}
                  />
                </div>
                {fieldErrors.hourlyRate && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.hourlyRate}</p>
                )}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.firstLessonFree}
                  onChange={(e) => setField('firstLessonFree', e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-slate-700">
                  提供<strong className="font-semibold">首堂免費試聽</strong>
                  <span className="text-xs text-slate-400 ml-1">（建議開啟，提升媒合率）</span>
                </span>
              </label>

              <div>
                <label htmlFor="headline" className="block text-xs font-medium text-slate-700 mb-1.5">
                  一句話標題（選填）
                </label>
                <input
                  id="headline"
                  type="text"
                  value={form.headline}
                  onChange={(e) => setField('headline', e.target.value)}
                  placeholder="空白則自動依科目與地區產生"
                  className={inputClass()}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs font-medium text-slate-700 mb-1.5">
                  個人簡介（選填）
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="學經歷、教學特色…空白則使用系統預設簡介"
                  className={`${inputClass()} resize-y`}
                />
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section className="space-y-5" aria-labelledby="step3-title">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Phone className="w-4 h-4 text-brand-500" />
                <h2 id="step3-title" className="text-sm font-bold text-slate-900">
                  步驟 3 · 解鎖後才顯示的聯絡方式
                </h2>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 px-3.5 py-3 text-xs text-emerald-800 leading-relaxed">
                家長需完成<strong>單次微付款解鎖</strong>後才看得到以下資訊，保護您的隱私。
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lineId" className="block text-xs font-medium text-slate-700 mb-1.5">
                    LINE ID
                  </label>
                  <input
                    id="lineId"
                    type="text"
                    value={form.lineId}
                    onChange={(e) => setField('lineId', e.target.value)}
                    placeholder="例：tutor_zhongli"
                    className={inputClass(fieldErrors.lineId)}
                  />
                  {fieldErrors.lineId && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.lineId}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                    聯絡電話
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="例：0912-345-678"
                    className={inputClass(fieldErrors.phone)}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Mini preview */}
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 text-sm mb-2">廣告預覽</p>
                <p>
                  <span className="text-slate-400">稱呼</span> {form.name || '—'}
                </p>
                <p>
                  <span className="text-slate-400">科目</span>{' '}
                  {form.specialtyTags.join('、') || '—'}
                </p>
                <p>
                  <span className="text-slate-400">地區</span>{' '}
                  {form.city}
                  {form.district}
                  {form.city ? '' : '—'}
                </p>
                <p>
                  <span className="text-slate-400">時薪</span>{' '}
                  {form.hourlyRate ? `NT$ ${form.hourlyRate}/hr` : '—'}
                </p>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
            </section>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 mt-7 pt-5 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                上一步
              </button>
            ) : (
              <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition">
                取消
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                下一步
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-6 py-2.5 rounded-xl transition cursor-pointer shadow-sm shadow-brand-500/20"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting
                  ? '正在刊登…'
                  : isEditMode
                    ? '更新廣告'
                    : '刊登家教廣告'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ApplyTopBar({ title = '刊登課程' }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-sm font-bold text-slate-900">{title}</span>
        <Link href="/" className="text-xs font-black tracking-tight text-slate-900">
          idaltu
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 ml-0.5 mb-0.5" />
        </Link>
      </div>
    </header>
  );
}
