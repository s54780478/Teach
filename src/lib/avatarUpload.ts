import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

export const AVATAR_BUCKET = 'avatars';
/** 壓縮後建議上限（bytes）；超過仍嘗試上傳但會提示 */
export const AVATAR_MAX_BYTES = 900_000;
export const AVATAR_MAX_EDGE = 800;

function isDicebearUrl(url: string): boolean {
  return url.includes('api.dicebear.com');
}

export function defaultAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name.trim() || 'T'
  )}&backgroundColor=f9a8d4`;
}

/** 若無自訂照片則用預設頭像 */
export function resolveAvatarUrl(avatarUrl: string | undefined | null, name: string): string {
  const trimmed = (avatarUrl || '').trim();
  if (trimmed && !isDicebearUrl(trimmed)) return trimmed;
  if (trimmed) return trimmed;
  return defaultAvatarUrl(name);
}

/**
 * 瀏覽器端壓縮為 JPEG，控制 Storage 用量與費用。
 */
export async function compressImageForAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('請選擇圖片檔（JPG／PNG／WEBP）');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('圖片請小於 12MB，壓縮後再上傳');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, AVATAR_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('無法處理圖片，請換一張再試');
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const toJpeg = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('圖片壓縮失敗'))),
        'image/jpeg',
        quality
      );
    });

  let blob = await toJpeg(0.82);
  if (blob.size > AVATAR_MAX_BYTES) {
    blob = await toJpeg(0.65);
  }
  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error('壓縮後仍過大，請換一張較小的照片');
  }
  return blob;
}

/**
 * 上傳至 Supabase Storage，路徑：{userId}/avatar.jpg
 * 回傳公開 URL；未設定 Supabase 時回傳錯誤。
 */
export async function uploadTutorAvatar(
  userId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: '尚未設定 Supabase，無法上傳照片。請稍後再試或聯繫管理員。' };
  }
  if (!userId) {
    return { error: '請先登入後再上傳照片' };
  }

  try {
    const blob = await compressImageForAvatar(file);
    const path = `${userId}/avatar.jpg`;

    const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

    if (upErr) {
      const msg = upErr.message.toLowerCase();
      if (msg.includes('bucket') || msg.includes('not found')) {
        return {
          error: '頭像空間尚未建立。請在 Supabase 執行 supabase/storage_avatars.sql 後重試。',
        };
      }
      return { error: upErr.message };
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = data.publicUrl;
    if (!url) return { error: '上傳成功但無法取得圖片網址' };

    // 避免 CDN／瀏覽器快取舊圖
    const bust = `v=${Date.now()}`;
    return { url: url.includes('?') ? `${url}&${bust}` : `${url}?${bust}` };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : '上傳失敗，請稍後再試' };
  }
}
