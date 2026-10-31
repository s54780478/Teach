import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { AVATAR_BUCKET, compressImageForAvatar } from '@/lib/avatarUpload';

export type AccountDocKind = 'diploma' | 'id_doc';

/**
 * 證件／文憑上傳（圖片會壓縮；PDF 限制 4MB）
 * 與頭像同用 avatars bucket，路徑：{userId}/{kind}.*
 */
export async function uploadAccountDocument(
  userId: string,
  kind: AccountDocKind,
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { error: '尚未設定 Supabase，無法上傳檔案' };
  }
  if (!userId) return { error: '請先登入' };

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isImage && !isPdf) {
    return { error: '請上傳圖片或 PDF' };
  }
  if (isPdf && file.size > 4 * 1024 * 1024) {
    return { error: 'PDF 請小於 4MB' };
  }

  try {
    let body: Blob = file;
    let contentType = file.type || 'application/octet-stream';
    let ext = 'bin';

    if (isImage) {
      body = await compressImageForAvatar(file);
      contentType = 'image/jpeg';
      ext = 'jpg';
    } else {
      ext = 'pdf';
      contentType = 'application/pdf';
    }

    const path = `${userId}/${kind}.${ext}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, body, {
      upsert: true,
      contentType,
      cacheControl: '3600',
    });

    if (error) {
      return { error: error.message };
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const bust = `v=${Date.now()}`;
    const url = data.publicUrl.includes('?')
      ? `${data.publicUrl}&${bust}`
      : `${data.publicUrl}?${bust}`;
    return { url };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : '上傳失敗' };
  }
}
