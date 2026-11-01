'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Loader2,
  Pause,
  Pencil,
  Plus,
  AlertCircle,
  UserRound,
  Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
  createTutorCourse,
  getCoursesByTutorId,
  getTutorProfileByUserId,
  updateCourseContent,
  updateCourseStatus,
  updateTutorDashboardProfile,
  upsertTutorProfile,
  type CourseEditInput,
  type TutorCourse,
} from '@/lib/tutorService';
import type {
  FreeLessonMinutes,
  TeachingMode,
  TeachingModeOption,
  Tutor,
} from '@/types/tutor';
import {
  DEFAULT_RESPONSE_TIME,
  FREE_LESSON_MINUTES,
  TEACHING_MODE_OPTIONS,
  modesFromLegacyMode,
} from '@/lib/teachingModes';
import {
  HEADLINE_MAX,
  clampHeadline,
  digitsOnlyAmount,
  digitsOnlyPhone,
  validateHeadlineRequired,
  validateHourlyRate,
  validatePhoneOptional,
} from '@/lib/formHelpers';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { AvatarPhotoField } from '@/components/AvatarPhotoField';
import { SiteFooter } from '@/components/SiteFooter';
import { LogoHomeLink } from '@/components/LogoHomeLink';
import { useStudentPass } from '@/hooks/useStudentPass';
import { TAXONOMY_CATEGORIES, categoryDisplayName } from '@/data/taxonomySeed';
import { TaxonomyPicker } from '@/components/TaxonomyPicker';
import { YoutubeIntroField } from '@/components/YoutubeIntroField';
import { selectionFromLegacy } from '@/lib/taxonomyService';
import { isMainCategoryKey } from '@/types/mainCategory';
import type { TutorTaxonomySelection } from '@/types/taxonomy';
import { validateOptionalYoutubeUrl } from '@/lib/youtubeUrl';
import {
  clearYoutubeDraft,
  readYoutubeDraft,
  writeYoutubeDraft,
} from '@/lib/youtubeDraft';

const MODE_LABEL: Record<TeachingMode, string> = {
  'in-person': '面對面授課',
  online: '線上教學',
  hybrid: '實體 + 線上',
};

const CATEGORIES = TAXONOMY_CATEGORIES.map((c) => c.name);

interface EditFormState {
  title: string;
  subject: string;
  subjectCategory: string;
  hourlyRate: string;
  description: string;
  mode: TeachingMode;
  city: string;
  district: string;
  firstLessonFree: boolean;
}

interface ProfileFormState {
  name: string;
  headline: string;
  bio: string;
  youtubeUrl: string;
  avatarUrl: string;
  specialtyTags: string[];
  subjectCategory: string;
  categoryId: string;
  city: string;
  district: string;
  teachingModes: TeachingModeOption[];
  hourlyRate: string;
  lineId: string;
  phone: string;
  email: string;
  firstLessonFree: boolean;
  freeLessonMinutes: FreeLessonMinutes;
  responseTime: string;
}

function courseToForm(course: TutorCourse): EditFormState {
  return {
    title: course.title,
    subject: course.subject,
    subjectCategory: course.subjectCategory || '其他',
    hourlyRate: String(course.hourlyRate || ''),
    description: course.description,
    mode: course.mode,
    city: course.city,
    district: course.district,
    firstLessonFree: course.firstLessonFree,
  };
}

function profileToForm(tutor: Tutor, userId?: string): ProfileFormState {
  const legacy = selectionFromLegacy({
    subjectCategory: tutor.subjectCategory,
    specialtyTags: tutor.specialtyTags,
    categoryId: tutor.mainCategory || tutor.categoryId,
  });
  const yt =
    tutor.youtubeUrl ||
    (userId ? readYoutubeDraft(userId) : '') ||
    '';
  if (userId && yt) writeYoutubeDraft(userId, yt);
  return {
    name: tutor.name,
    headline: tutor.headline.slice(0, 50),
    bio: tutor.bio,
    youtubeUrl: yt,
    avatarUrl: tutor.avatarUrl,
    specialtyTags: tutor.specialtyTags || [],
    subjectCategory: tutor.subjectCategory || categoryDisplayName(legacy.categoryId),
    categoryId: tutor.mainCategory || tutor.categoryId || legacy.categoryId,
    city: tutor.location.city,
    district: tutor.location.district,
    teachingModes:
      tutor.teachingModes?.length > 0
        ? tutor.teachingModes
        : modesFromLegacyMode(tutor.mode),
    hourlyRate: String(tutor.hourlyRate || ''),
    lineId: tutor.contact.lineId === '未提供' ? '' : tutor.contact.lineId,
    phone: tutor.contact.phone === '未提供' ? '' : tutor.contact.phone,
    email: tutor.contact.email === '未提供' ? '' : tutor.contact.email,
    firstLessonFree: tutor.firstLessonFree,
    freeLessonMinutes: tutor.freeLessonMinutes || 60,
    responseTime: tutor.responseTime || DEFAULT_RESPONSE_TIME,
  };
}

const emptyCourseForm = (): EditFormState => ({
  title: '',
  subject: '',
  subjectCategory: '其他',
  hourlyRate: '800',
  description: '',
  mode: 'hybrid',
  city: '台北市',
  district: '',
  firstLessonFree: true,
});

export default function TutorDashboardPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [tab, setTab] = useState<'profile' | 'courses'>('profile');

  const [profile, setProfile] = useState<Tutor | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<EditFormState>(emptyCourseForm());
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [clearYoutube, setClearYoutube] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    currentUser,
    authReady,
    studentPass,
    contactedTutorIds,
    signOut,
  } = useStudentPass();

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const loadDashboard = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [tutorProfile, courseResult] = await Promise.all([
        getTutorProfileByUserId(userId),
        getCoursesByTutorId(userId),
      ]);
      setProfile(tutorProfile);
      if (tutorProfile) {
        setProfileForm(profileToForm(tutorProfile, userId));
        setClearYoutube(false);
      } else setProfileForm(null);
      if (courseResult.error) setError(courseResult.error);
      setCourses(courseResult.courses);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (currentUser) {
      void loadDashboard(currentUser.id);
    } else {
      setIsLoading(false);
      setIsAuthModalOpen(true);
      setProfile(null);
      setProfileForm(null);
      setCourses([]);
    }
  }, [authReady, currentUser, loadDashboard]);

  const openEdit = (course: TutorCourse) => {
    setIsCreating(false);
    setEditingId(course.id);
    setEditForm(courseToForm(course));
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !profileForm) return;
    const rate = Number(profileForm.hourlyRate);
    if (!profileForm.name.trim()) {
      showToast('請填寫姓名');
      return;
    }
    const rateErr = validateHourlyRate(profileForm.hourlyRate);
    if (rateErr) {
      showToast(rateErr);
      return;
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      showToast('請輸入有效時薪');
      return;
    }
    if (profileForm.teachingModes.length === 0) {
      showToast('請至少選擇一種授課方式');
      return;
    }
    const headlineErr = validateHeadlineRequired(profileForm.headline);
    if (headlineErr) {
      showToast(headlineErr);
      return;
    }
    const phoneErr = validatePhoneOptional(profileForm.phone);
    if (phoneErr) {
      showToast(phoneErr);
      return;
    }

    if (profileForm.specialtyTags.length === 0) {
      showToast('請至少選擇或新增一個專長標籤');
      return;
    }
    const ytCheck = validateOptionalYoutubeUrl(profileForm.youtubeUrl);
    if (!ytCheck.ok) {
      showToast(ytCheck.message);
      return;
    }

    setIsSavingProfile(true);

    const profilePayload = {
      name: profileForm.name,
      headline: profileForm.headline.slice(0, 50),
      bio: profileForm.bio,
      youtubeUrl: profileForm.youtubeUrl.trim(),
      clearYoutube,
      avatarUrl: profileForm.avatarUrl,
      specialtyTags: profileForm.specialtyTags,
      subjectCategory: profileForm.subjectCategory,
      mainCategory: isMainCategoryKey(profileForm.categoryId)
        ? profileForm.categoryId
        : undefined,
      categoryId: profileForm.categoryId,
      city: profileForm.city,
      district: profileForm.district,
      teachingModes: profileForm.teachingModes,
      hourlyRate: rate,
      lineId: profileForm.lineId,
      phone: profileForm.phone,
      email: profileForm.email || currentUser.email || undefined,
      firstLessonFree: profileForm.firstLessonFree,
      freeLessonMinutes: profileForm.freeLessonMinutes,
      responseTime: profileForm.responseTime || DEFAULT_RESPONSE_TIME,
    };

    let result = await updateTutorDashboardProfile(currentUser.id, profilePayload);

    // 尚無履歷列時改走 upsert
    if (!result.success && !profile) {
      result = await upsertTutorProfile(currentUser.id, {
        ...profilePayload,
        degree: '',
        headline: profilePayload.headline || `${profileForm.name} 的課程`,
      });
    }

    setIsSavingProfile(false);
    if (!result.success) {
      showToast(result.error || '履歷儲存失敗');
      return;
    }
    if (clearYoutube) {
      clearYoutubeDraft(currentUser.id);
    } else if (ytCheck.value) {
      writeYoutubeDraft(currentUser.id, ytCheck.value);
    }
    setClearYoutube(false);
    showToast(
      ytCheck.value || profileForm.youtubeUrl.trim()
        ? '履歷已儲存（含自我介紹影片）'
        : '履歷已儲存'
    );
    await loadDashboard(currentUser.id);
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !editingId || !editForm) return;
    const rate = Number(editForm.hourlyRate);
    if (!editForm.title.trim()) {
      showToast('請填寫課程標題');
      return;
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      showToast('請輸入有效時薪');
      return;
    }

    const input: CourseEditInput = {
      title: editForm.title,
      subject: editForm.subject,
      subjectCategory: editForm.subjectCategory,
      hourlyRate: rate,
      description: editForm.description,
      mode: editForm.mode,
      city: editForm.city,
      district: editForm.district,
      firstLessonFree: editForm.firstLessonFree,
    };

    setIsSaving(true);
    const result = await updateCourseContent(editingId, currentUser.id, input);
    setIsSaving(false);

    if (!result.success) {
      showToast(result.error || '儲存失敗');
      return;
    }
    showToast('課程已更新');
    closeEdit();
    await loadDashboard(currentUser.id);
  };

  const handleCreateCourse = async () => {
    if (!currentUser) return;
    const rate = Number(createForm.hourlyRate);
    if (!createForm.title.trim()) {
      showToast('請填寫課程標題');
      return;
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      showToast('請輸入有效時薪');
      return;
    }

    setIsSaving(true);
    const result = await createTutorCourse(currentUser.id, {
      title: createForm.title,
      subject: createForm.subject,
      subjectCategory: createForm.subjectCategory,
      hourlyRate: rate,
      description: createForm.description,
      mode: createForm.mode,
      city: createForm.city,
      district: createForm.district,
      firstLessonFree: createForm.firstLessonFree,
    });
    setIsSaving(false);

    if (!result.success) {
      showToast(result.error || '新增失敗');
      return;
    }
    showToast('課程已新增並上架');
    setIsCreating(false);
    setCreateForm(emptyCourseForm());
    await loadDashboard(currentUser.id);
  };

  const handleToggleStatus = async (course: TutorCourse) => {
    if (!currentUser) return;
    const next = course.status === 'active' ? 'paused' : 'active';
    setTogglingId(course.id);
    const result = await updateCourseStatus(course.id, currentUser.id, next);
    setTogglingId(null);
    if (!result.success) {
      showToast(result.error || '狀態更新失敗');
      return;
    }
    showToast(next === 'active' ? '課程已上架' : '課程已下架暫停');
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, status: next } : c))
    );
  };

  const renderCourseFields = (
    form: EditFormState,
    setForm: (f: EditFormState) => void,
    idPrefix: string
  ) => (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-title`}>
          課程標題
        </label>
        <input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-subject`}>
          授課科目
        </label>
        <input
          id={`${idPrefix}-subject`}
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          placeholder="例：高中物理"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-cat`}>
          科目分類
        </label>
        <select
          id={`${idPrefix}-cat`}
          value={form.subjectCategory}
          onChange={(e) => setForm({ ...form, subjectCategory: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-rate`}>
          時薪（NT$）
        </label>
        <input
          id={`${idPrefix}-rate`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={form.hourlyRate}
          onChange={(e) =>
            setForm({ ...form, hourlyRate: digitsOnlyAmount(e.target.value) })
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-mode`}>
          授課方式
        </label>
        <select
          id={`${idPrefix}-mode`}
          value={form.mode}
          onChange={(e) => setForm({ ...form, mode: e.target.value as TeachingMode })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
        >
          <option value="in-person">面對面授課</option>
          <option value="online">線上教學</option>
          <option value="hybrid">實體 + 線上</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-city`}>
          縣市
        </label>
        <input
          id={`${idPrefix}-city`}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-district`}>
          行政區
        </label>
        <input
          id={`${idPrefix}-district`}
          value={form.district}
          onChange={(e) => setForm({ ...form, district: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor={`${idPrefix}-desc`}>
          課程／自我介紹
        </label>
        <textarea
          id={`${idPrefix}-desc`}
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-y"
        />
      </div>
      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.firstLessonFree}
          onChange={(e) => setForm({ ...form, firstLessonFree: e.target.checked })}
          className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
        />
        首堂免費試教
      </label>
    </div>
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col">
      <Header
        variant="light"
        user={currentUser}
        hasStudentPass={studentPass.active}
        contactedCount={contactedTutorIds.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={() => void signOut()}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <LogoHomeLink className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          回首頁
        </LogoHomeLink>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              導師後台
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {profile ? `嗨，${profile.name} · 管理履歷與課程上架` : '編輯履歷、新增與下架課程'}
            </p>
          </div>
          <Link
            href="/tutor/apply"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 bg-white transition"
          >
            完整刊登精靈
          </Link>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl bg-slate-200/70 mb-6 max-w-md">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition cursor-pointer ${
              tab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserRound className="w-4 h-4" />
            履歷資料
          </button>
          <button
            type="button"
            onClick={() => setTab('courses')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition cursor-pointer ${
              tab === 'courses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            課程管理
          </button>
        </div>

        {!currentUser ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-600">請先登入以管理您的履歷與課程</p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-full cursor-pointer"
            >
              登入
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {tab === 'profile' && (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 space-y-4">
                {!profileForm ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600 mb-4">尚未建立履歷，請先填寫基本資料</p>
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm({
                          name: '',
                          headline: '',
                          bio: '',
                          youtubeUrl: currentUser
                            ? readYoutubeDraft(currentUser.id)
                            : '',
                          avatarUrl: '',
                          specialtyTags: [],
                          subjectCategory: categoryDisplayName('academic'),
                          categoryId: 'academic',
                          city: '台北市',
                          district: '',
                          teachingModes: ['online', 'in_person', 'student_home'],
                          hourlyRate: '800',
                          lineId: '',
                          phone: '',
                          email: currentUser.email || '',
                          firstLessonFree: true,
                          freeLessonMinutes: 60,
                          responseTime: DEFAULT_RESPONSE_TIME,
                        })
                      }
                      className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-5 py-2.5 rounded-full cursor-pointer"
                    >
                      開始建立履歷
                    </button>
                  </div>
                ) : (
                  <>
                    {currentUser && (
                      <AvatarPhotoField
                        userId={currentUser.id}
                        nameForFallback={profileForm.name}
                        value={
                          profileForm.avatarUrl.includes('api.dicebear.com')
                            ? ''
                            : profileForm.avatarUrl
                        }
                        onChange={(url) =>
                          setProfileForm({ ...profileForm, avatarUrl: url })
                        }
                        disabled={isSavingProfile}
                      />
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-name">
                          姓名
                        </label>
                        <input
                          id="pf-name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-rate">
                          時薪（NT$）
                        </label>
                        <input
                          id="pf-rate"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={profileForm.hourlyRate}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              hourlyRate: digitsOnlyAmount(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-headline">
                          個人頭銜 (Headline) · {profileForm.headline.length}/{HEADLINE_MAX}
                        </label>
                        <input
                          id="pf-headline"
                          maxLength={HEADLINE_MAX}
                          value={profileForm.headline}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              headline: clampHeadline(e.target.value),
                            })
                          }
                          placeholder="例：10 年國立大學物理系講師"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-bio">
                          自我介紹
                        </label>
                        <textarea
                          id="pf-bio"
                          rows={4}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          placeholder="請勿貼 YouTube／外連；影片請用下方欄位"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-y"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <YoutubeIntroField
                          id="pf-youtube"
                          value={profileForm.youtubeUrl}
                          onChange={(v) => {
                            setClearYoutube(false);
                            setProfileForm({ ...profileForm, youtubeUrl: v });
                            writeYoutubeDraft(currentUser.id, v);
                          }}
                          onClear={() => {
                            setClearYoutube(true);
                            setProfileForm({ ...profileForm, youtubeUrl: '' });
                            clearYoutubeDraft(currentUser.id);
                          }}
                          disabled={isSavingProfile}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <TaxonomyPicker
                          value={{
                            categoryId: profileForm.categoryId,
                            tags: profileForm.specialtyTags,
                          }}
                          onChange={(next: TutorTaxonomySelection) =>
                            setProfileForm({
                              ...profileForm,
                              categoryId: next.categoryId,
                              specialtyTags: next.tags,
                              subjectCategory: categoryDisplayName(next.categoryId),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-city">
                          地區（縣市）
                        </label>
                        <input
                          id="pf-city"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-district">
                          行政區
                        </label>
                        <input
                          id="pf-district"
                          value={profileForm.district}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, district: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-line">
                          LINE ID
                        </label>
                        <input
                          id="pf-line"
                          value={profileForm.lineId}
                          onChange={(e) => setProfileForm({ ...profileForm, lineId: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="pf-phone">
                          電話號碼
                        </label>
                        <input
                          id="pf-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: digitsOnlyPhone(e.target.value, false),
                            })
                          }
                          placeholder="0912345678"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <p className="block text-xs font-medium text-slate-500">
                          授課方式（可多選）
                        </p>
                        <div className="grid sm:grid-cols-3 gap-2">
                          {TEACHING_MODE_OPTIONS.map((opt) => {
                            const checked = profileForm.teachingModes.includes(opt.id);
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                                  checked
                                    ? 'border-brand-500 bg-brand-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? profileForm.teachingModes.filter((m) => m !== opt.id)
                                      : [...profileForm.teachingModes, opt.id];
                                    setProfileForm({ ...profileForm, teachingModes: next });
                                  }}
                                  className="mt-0.5 w-4 h-4 accent-brand-500"
                                />
                                <span>
                                  <span className="block text-sm font-semibold text-slate-900">
                                    {opt.label}
                                  </span>
                                  <span className="block text-[11px] text-slate-400">
                                    {opt.hint}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
                        <label className="flex items-center justify-between gap-3 cursor-pointer">
                          <span className="text-sm text-slate-800 font-medium">
                            第一堂課免費
                            <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                              預設開啟 · 可選 30／45／60 分鐘體驗
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={profileForm.firstLessonFree}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                firstLessonFree: e.target.checked,
                              })
                            }
                            className="w-5 h-5 accent-brand-500"
                          />
                        </label>
                        {profileForm.firstLessonFree && (
                          <div className="flex flex-wrap gap-2">
                            {FREE_LESSON_MINUTES.map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() =>
                                  setProfileForm({
                                    ...profileForm,
                                    freeLessonMinutes: mins,
                                  })
                                }
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                                  profileForm.freeLessonMinutes === mins
                                    ? 'bg-brand-500 text-white border-brand-500'
                                    : 'bg-white text-slate-600 border-slate-200'
                                }`}
                              >
                                {mins} 分鐘
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          className="block text-xs font-medium text-slate-500 mb-1"
                          htmlFor="pf-response"
                        >
                          平均回覆時間（卡片顯示）
                        </label>
                        <input
                          id="pf-response"
                          value={profileForm.responseTime}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              responseTime: e.target.value,
                            })
                          }
                          placeholder={DEFAULT_RESPONSE_TIME}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={() => void handleSaveProfile()}
                      className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-full transition cursor-pointer"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      儲存履歷
                    </button>
                  </>
                )}
              </section>
            )}

            {tab === 'courses' && (
              <section className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      closeEdit();
                      setIsCreating(true);
                      setCreateForm(
                        profile
                          ? {
                              ...emptyCourseForm(),
                              title: profile.headline || `${profile.name} 的課程`,
                              subject: profile.specialtyTags[0] || '',
                              subjectCategory: profile.subjectCategory || '其他',
                              hourlyRate: String(profile.hourlyRate),
                              description: profile.bio,
                              mode: profile.mode,
                              city: profile.location.city,
                              district: profile.location.district,
                              firstLessonFree: profile.firstLessonFree,
                            }
                          : emptyCourseForm()
                      );
                    }}
                    className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-4 py-2.5 rounded-full transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    新增課程
                  </button>
                </div>

                {isCreating && (
                  <div className="rounded-2xl border border-brand-500/30 bg-white shadow-sm p-5 sm:p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900">新增課程</h2>
                    {renderCourseFields(createForm, setCreateForm, 'new')}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleCreateCourse()}
                        className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-4 py-2.5 rounded-full cursor-pointer disabled:opacity-60"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        建立並上架
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="text-sm text-slate-500 px-3 py-2 cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {courses.length === 0 && !isCreating ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <h2 className="text-sm font-bold text-slate-800">尚無課程刊登</h2>
                    <p className="text-xs text-slate-500 mt-1.5">點擊「新增課程」開始上架</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {courses.map((course) => {
                      const isActive = course.status === 'active';
                      const isEditing = editingId === course.id;
                      return (
                        <li
                          key={course.id}
                          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                        >
                          <div className="p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                      isActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {isActive ? (
                                      <>
                                        <CheckCircle className="w-3 h-3" /> Active 上架中
                                      </>
                                    ) : (
                                      <>
                                        <Pause className="w-3 h-3" /> Paused 已下架
                                      </>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {MODE_LABEL[course.mode]}
                                  </span>
                                </div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                  {course.title}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                  {course.subject || course.subjectCategory || '未設定科目'}
                                  {course.city ? ` · ${course.city}${course.district}` : ''}
                                </p>
                                <p className="mt-2 text-lg font-bold text-brand-500">
                                  NT$ {course.hourlyRate.toLocaleString()}
                                  <span className="text-xs font-medium text-slate-400 ml-1">
                                    / 小時
                                  </span>
                                </p>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEdit(course)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  編輯內容
                                </button>
                                <button
                                  type="button"
                                  disabled={togglingId === course.id}
                                  onClick={() => void handleToggleStatus(course)}
                                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                                    isActive
                                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      : 'bg-brand-500 text-white hover:bg-brand-600'
                                  }`}
                                >
                                  {togglingId === course.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : isActive ? (
                                    '下架 Pause'
                                  ) : (
                                    '上架 Active'
                                  )}
                                </button>
                              </div>
                            </div>

                            {isEditing && editForm && (
                              <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">編輯課程內容</h3>
                                {renderCourseFields(editForm, setEditForm, 'edit')}
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => void handleSaveEdit()}
                                    className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-full transition cursor-pointer"
                                  >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    儲存變更
                                  </button>
                                  <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <SiteFooter variant="light" />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg"
        >
          {toast}
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const user = session?.user;
          if (!user) return;
          setIsAuthModalOpen(false);
          await loadDashboard(user.id);
        }}
      />
    </div>
  );
}
