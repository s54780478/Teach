import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { defaultAvatarUrl } from '@/lib/avatarUpload';

export interface AccountProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthday: string;
  email: string;
  phone: string;
  avatarUrl: string;
  addressText: string;
  notifySmsRequests: boolean;
  notifyEmailActivity: boolean;
  notifyEmailRequests: boolean;
  notifyEmailReceived: boolean;
  notifyEmailNewsletter: boolean;
  diplomaUrl: string;
  idDocUrl: string;
}

const STORAGE_PREFIX = 'idaltu_account_profile:';

export function emptyAccountProfile(email = ''): AccountProfile {
  return {
    displayName: '',
    firstName: '',
    lastName: '',
    gender: '',
    birthday: '',
    email,
    phone: '',
    avatarUrl: '',
    addressText: '',
    notifySmsRequests: true,
    notifyEmailActivity: true,
    notifyEmailRequests: true,
    notifyEmailReceived: true,
    notifyEmailNewsletter: true,
    diplomaUrl: '',
    idDocUrl: '',
  };
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readLocal(userId: string): AccountProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return { ...emptyAccountProfile(), ...JSON.parse(raw) } as AccountProfile;
  } catch {
    return null;
  }
}

function writeLocal(userId: string, profile: AccountProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

function mapRow(row: Record<string, unknown>, emailFallback: string): AccountProfile {
  return {
    displayName: String(row.display_name || ''),
    firstName: String(row.first_name || ''),
    lastName: String(row.last_name || ''),
    gender: String(row.gender || ''),
    birthday: row.birthday ? String(row.birthday).slice(0, 10) : '',
    email: String(row.email || emailFallback),
    phone: String(row.phone || ''),
    avatarUrl: String(row.avatar_url || ''),
    addressText: String(row.address_text || ''),
    notifySmsRequests: row.notify_sms_requests !== false,
    notifyEmailActivity: row.notify_email_activity !== false,
    notifyEmailRequests: row.notify_email_requests !== false,
    notifyEmailReceived: row.notify_email_received !== false,
    notifyEmailNewsletter: row.notify_email_newsletter !== false,
    diplomaUrl: String(row.diploma_url || ''),
    idDocUrl: String(row.id_doc_url || ''),
  };
}

export function accountDisplayName(profile: AccountProfile, email?: string | null): string {
  const fromParts = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  if (profile.displayName.trim()) return profile.displayName.trim();
  if (fromParts) return fromParts;
  if (email) return email.split('@')[0] || '會員';
  return '會員';
}

export function accountAvatarSrc(
  profileOrUrl: AccountProfile | string,
  name: string
): string {
  const url =
    typeof profileOrUrl === 'string' ? profileOrUrl : profileOrUrl.avatarUrl;
  return url.trim() || defaultAvatarUrl(name);
}

export async function loadAccountProfile(
  userId: string,
  email?: string | null
): Promise<AccountProfile> {
  const local = readLocal(userId);
  const base = emptyAccountProfile(email || '');

  if (!isSupabaseConfigured) {
    return { ...base, ...local, email: email || local?.email || '' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return { ...base, ...local, email: email || local?.email || '' };
    }

    const fromDb = mapRow(data as Record<string, unknown>, email || '');
    // local 可補 DB 尚未有的欄位
    return { ...base, ...fromDb, ...pickNonEmpty(local), email: fromDb.email || email || '' };
  } catch {
    return { ...base, ...local, email: email || local?.email || '' };
  }
}

function pickNonEmpty(local: AccountProfile | null): Partial<AccountProfile> {
  if (!local) return {};
  const out: Partial<AccountProfile> = {};
  (Object.keys(local) as (keyof AccountProfile)[]).forEach((k) => {
    const v = local[k];
    if (typeof v === 'string' && v.trim()) out[k] = v as never;
  });
  return out;
}

export async function saveAccountProfile(
  userId: string,
  profile: AccountProfile
): Promise<{ success: boolean; error?: string }> {
  writeLocal(userId, profile);

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  const payload = {
    id: userId,
    email: profile.email || null,
    display_name: profile.displayName || null,
    first_name: profile.firstName || null,
    last_name: profile.lastName || null,
    gender: profile.gender || null,
    birthday: profile.birthday || null,
    phone: profile.phone || null,
    avatar_url: profile.avatarUrl || null,
    address_text: profile.addressText || null,
    notify_sms_requests: profile.notifySmsRequests,
    notify_email_activity: profile.notifyEmailActivity,
    notify_email_requests: profile.notifyEmailRequests,
    notify_email_received: profile.notifyEmailReceived,
    notify_email_newsletter: profile.notifyEmailNewsletter,
    diploma_url: profile.diplomaUrl || null,
    id_doc_url: profile.idDocUrl || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    // 欄位尚未 migration 時仍保留本機
    if (/column|schema|does not exist/i.test(error.message)) {
      return { success: true };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}
