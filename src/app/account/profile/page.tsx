'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  IdCard,
  Loader2,
  MapPin,
  Upload,
} from 'lucide-react';
import { useStudentPass } from '@/hooks/useStudentPass';
import {
  accountDisplayName,
  emptyAccountProfile,
  loadAccountProfile,
  saveAccountProfile,
  type AccountProfile,
} from '@/lib/accountProfile';
import { uploadAccountDocument } from '@/lib/documentUpload';
import { ProfilePhotoCard } from '@/components/account/ProfilePhotoCard';
import { showAppToast } from '@/lib/appToast';

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer">
      <span className="text-sm text-white/75">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${
          checked ? 'bg-[#34c759]' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}

function DocUploadCard({
  title,
  kind,
  url,
  userId,
  onUploaded,
}: {
  title: string;
  kind: 'diploma' | 'id_doc';
  url: string;
  userId: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="flex flex-col items-center justify-center py-6 text-white/30">
        {kind === 'diploma' ? (
          <FileText className="w-14 h-14 mb-4" strokeWidth={1.2} />
        ) : (
          <IdCard className="w-14 h-14 mb-4" strokeWidth={1.2} />
        )}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#5ac8fa] hover:underline mb-3"
          >
            已上傳，點此查看
          </a>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            setBusy(true);
            const result = await uploadAccountDocument(userId, kind, f);
            setBusy(false);
            if (result.error || !result.url) {
              showAppToast(result.error || '上傳失敗', 'error');
              return;
            }
            onUploaded(result.url);
            showAppToast('上傳成功', 'success');
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#FF6363] hover:bg-[#ff5252] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          上傳
        </button>
      </div>
    </div>
  );
}

export default function AccountProfilePage() {
  const { currentUser, signOut } = useStudentPass();
  const [profile, setProfile] = useState<AccountProfile>(emptyAccountProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setLoading(true);
    void loadAccountProfile(currentUser.id, currentUser.email).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6363]" />
      </div>
    );
  }

  const name = accountDisplayName(profile, currentUser.email);

  const persist = async (next: AccountProfile) => {
    setProfile(next);
    setSaving(true);
    const result = await saveAccountProfile(currentUser.id, next);
    setSaving(false);
    if (!result.success) {
      showAppToast(result.error || '儲存失敗', 'error');
      return;
    }
    showAppToast('已儲存', 'success');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
      {/* 左欄 */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5">
          <h3 className="text-sm font-semibold mb-4">基本資訊</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="sr-only">性別</span>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full h-11 rounded-xl bg-[#2c2c2e] border border-white/10 px-3 text-sm text-white focus:outline-none"
              >
                <option value="">性別</option>
                <option value="female">女性</option>
                <option value="male">男性</option>
                <option value="other">其他／不顯示</option>
              </select>
            </label>
            <input
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              placeholder="名字"
              className="w-full h-11 rounded-xl bg-[#2c2c2e] border border-white/10 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <input
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              placeholder="姓氏"
              className="w-full h-11 rounded-xl bg-[#2c2c2e] border border-white/10 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <input
              type="date"
              value={profile.birthday}
              onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
              className="w-full h-11 rounded-xl bg-[#2c2c2e] border border-white/10 px-3 text-sm text-white focus:outline-none"
            />
            <input
              type="email"
              value={profile.email || currentUser.email || ''}
              readOnly
              className="w-full h-11 rounded-xl bg-[#2c2c2e]/80 border border-white/10 px-3 text-sm text-white/80"
            />
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="電話號碼"
              className="w-full h-11 rounded-xl bg-[#2c2c2e] border border-white/10 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void persist({
                  ...profile,
                  displayName:
                    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
                    profile.displayName,
                  email: profile.email || currentUser.email || '',
                })
              }
              className="w-full h-11 rounded-xl bg-[#FF6363] hover:bg-[#ff5252] text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? '儲存中…' : '確認'}
            </button>
          </div>
        </div>

        <DocUploadCard
          title="文憑"
          kind="diploma"
          url={profile.diplomaUrl}
          userId={currentUser.id}
          onUploaded={(url) => void persist({ ...profile, diplomaUrl: url })}
        />

        <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5">
          <h3 className="text-sm font-semibold mb-2">通知設定</h3>
          <p className="text-[11px] text-white/40 mb-2">簡訊</p>
          <ToggleRow
            label="課程請求"
            checked={profile.notifySmsRequests}
            onChange={(v) => setProfile({ ...profile, notifySmsRequests: v })}
          />
          <p className="text-[11px] text-white/40 mt-3 mb-2">電子信箱</p>
          <ToggleRow
            label="帳戶活動"
            checked={profile.notifyEmailActivity}
            onChange={(v) => setProfile({ ...profile, notifyEmailActivity: v })}
          />
          <ToggleRow
            label="課程請求"
            checked={profile.notifyEmailRequests}
            onChange={(v) => setProfile({ ...profile, notifyEmailRequests: v })}
          />
          <ToggleRow
            label="收到的課程請求"
            checked={profile.notifyEmailReceived}
            onChange={(v) => setProfile({ ...profile, notifyEmailReceived: v })}
          />
          <ToggleRow
            label="電子報"
            checked={profile.notifyEmailNewsletter}
            onChange={(v) => setProfile({ ...profile, notifyEmailNewsletter: v })}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist(profile)}
            className="mt-3 w-full h-10 rounded-xl border border-white/15 text-xs font-semibold text-white/80 hover:bg-white/5 cursor-pointer"
          >
            儲存通知設定
          </button>
        </div>
      </div>

      {/* 中欄 */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5">
          <h3 className="text-sm font-semibold mb-4">聯絡地址</h3>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#2c2c2e] aspect-[4/3] relative flex items-center justify-center">
            <MapPin className="w-8 h-8 text-[#FF6363]" />
            <p className="absolute bottom-3 left-3 right-3 text-[11px] text-white/50">
              地址僅供媒合參考，不會公開顯示在課程卡。
            </p>
          </div>
          <input
            value={profile.addressText}
            onChange={(e) => setProfile({ ...profile, addressText: e.target.value })}
            placeholder="城市／行政區（例：台北市大安區）"
            className="mt-3 w-full h-11 rounded-xl bg-[#2c2c2e] border border-white/10 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist(profile)}
            className="mt-3 w-full h-10 rounded-xl bg-[#FF6363] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            儲存地址
          </button>
        </div>

        <DocUploadCard
          title="相關身份證件"
          kind="id_doc"
          url={profile.idDocUrl}
          userId={currentUser.id}
          onUploaded={(url) => void persist({ ...profile, idDocUrl: url })}
        />

        <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5">
          <h3 className="text-sm font-semibold mb-2">刪除帳戶</h3>
          <p className="text-xs text-white/45 leading-relaxed mb-4">
            刪除帳戶後，個人資料與訂閱狀態將無法復原。若僅需登出，請使用右上角選單。
          </p>
          <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={deleteChecked}
              onChange={(e) => setDeleteChecked(e.target.checked)}
              className="mt-0.5"
            />
            我了解並確認要刪除帳戶
          </label>
          <button
            type="button"
            disabled={!deleteChecked}
            onClick={() => {
              showAppToast('帳戶刪除需聯繫客服處理（MVP 暫未開放一鍵刪除）', 'info');
              void signOut();
            }}
            className="w-full h-11 rounded-xl bg-white/10 text-white/50 text-sm font-semibold disabled:opacity-40 enabled:bg-[#FF6363] enabled:text-white cursor-pointer"
          >
            刪除我的帳戶
          </button>
        </div>
      </div>

      {/* 右欄：照片 */}
      <div>
        <ProfilePhotoCard
          userId={currentUser.id}
          name={name}
          avatarUrl={profile.avatarUrl}
          large
          onChange={(url) => void persist({ ...profile, avatarUrl: url })}
        />
      </div>
    </div>
  );
}
