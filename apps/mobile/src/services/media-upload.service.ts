/**
 * Media Upload Service
 * 
 * Supabase Storage'a media upload işlemleri
 * PGMQ entegrasyonu ile arka plan optimizasyonu
 * 
 * Akış:
 * 1. Raw dosya hızlıca upload edilir
 * 2. PGMQ'ya optimize job gönderilir
 * 3. Worker arka planda optimize eder
 * 4. Kullanıcı beklemez, UX smooth kalır
 */

import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client (will set auth token per request)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  type: 'image' | 'video' | 'audio';
  size: number;
}

/**
 * Generate unique filename
 */
function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop();
  return `${userId}/${timestamp}_${random}.${extension}`;
}

/**
 * Get media type from URI
 */
function getMediaType(uri: string): 'image' | 'video' | 'audio' {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(extension || '')) {
    return 'image';
  }
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) {
    return 'video';
  }
  return 'audio';
}

/**
 * Validate file size
 */
function validateFileSize(size: number, type: 'image' | 'video' | 'audio'): boolean {
  const limits = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 10 * 1024 * 1024, // 10MB
  };
  
  return size <= limits[type];
}

/**
 * Upload media to Supabase Storage
 */
export async function uploadMedia(
  uri: string,
  userId: string,
  bucket: 'post-media' | 'voice-moments' | 'stories' | 'message-media',
  accessToken: string
): Promise<UploadResult> {
  try {
    // Normalize URI - handle different URI schemes
    let normalizedUri = uri;
    
    // Handle Photos Library URI (ph://) - iOS
    if (uri.startsWith('ph://')) {
      const assetId = uri.replace('ph://', '').split('/')[0];
      const asset = await MediaLibrary.getAssetInfoAsync(assetId);
      if (!asset.localUri) {
        throw new Error('Could not get local URI for photo library asset');
      }
      normalizedUri = asset.localUri;
    }
    // Handle duplicate file:// prefix
    else if (uri.startsWith('file://file://')) {
      normalizedUri = uri.replace('file://file://', 'file://');
    }
    // Handle missing file:// prefix
    else if (!uri.startsWith('file://') && uri.startsWith('/')) {
      normalizedUri = `file://${uri}`;
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    const mediaType = getMediaType(normalizedUri);
    const fileSize = fileInfo.size || 0;

    // Validate size
    if (!validateFileSize(fileSize, mediaType)) {
      throw new Error(`File too large for ${mediaType}`);
    }

    // Get content type (force JPEG for HEIC images)
    let contentType = mediaType === 'image' 
      ? 'image/jpeg' 
      : mediaType === 'video' 
      ? 'video/mp4' 
      : 'audio/mpeg';
    
    // HEIC not supported by Supabase, convert to JPEG
    if (normalizedUri.toLowerCase().includes('.heic')) {
      contentType = 'image/jpeg';
    }

    // Generate filename
    const fileName = generateFileName(normalizedUri.split('/').pop() || 'file', userId);

    // Upload using Expo FileSystem (most reliable for React Native)
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
    
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, normalizedUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: contentType, // Force JPEG for HEIC
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (uploadResult.status !== 200) {
      logger.error('Upload error', new Error(uploadResult.body), { tag: 'MediaUpload' });
      throw new Error(`Upload failed: ${uploadResult.status} - ${uploadResult.body}`);
    }

    const data = JSON.parse(uploadResult.body);

    // Get public URL using fileName (data.path might be undefined)
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path || fileName);

    return {
      url: publicUrl,
      path: fileName,
      type: mediaType,
      size: fileSize,
    };
  } catch (error) {
    logger.error('Media upload error', error, { tag: 'MediaUpload' });
    throw error;
  }
}

/**
 * Upload multiple media files
 */
export async function uploadMultipleMedia(
  uris: string[],
  userId: string,
  bucket: 'post-media' | 'voice-moments' | 'stories' | 'message-media',
  accessToken: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < uris.length; i++) {
    const result = await uploadMedia(uris[i], userId, bucket, accessToken);
    results.push(result);
  }

  return results;
}

/**
 * Delete media from Supabase Storage
 */
export async function deleteMedia(
  path: string,
  bucket: 'post-media' | 'voice-moments' | 'stories' | 'message-media'
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }
}

// =============================================
// PGMQ MEDIA PROCESSING
// =============================================

// Preset tipleri - Edge Function ile senkron
export type MediaPreset = 'chat' | 'post' | 'story' | 'profile';

export interface QueueMediaOptions {
  preset?: MediaPreset;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface QueueMediaResult {
  message_id: number;
  queued: boolean;
}

/**
 * Queue media for background optimization
 * 
 * Upload sonrası çağrılır, worker arka planda optimize eder
 * Edge Function üzerinden PGMQ'ya job gönderir
 * 
 * @param userId - Kullanıcı ID
 * @param sourcePath - Storage path (örn: "userId/timestamp_random.jpg")
 * @param accessToken - Supabase access token
 * @param messageId - İlişkili mesaj ID (opsiyonel)
 * @param options - Optimization seçenekleri
 */
export async function queueMediaProcessing(
  userId: string,
  sourcePath: string,
  accessToken: string,
  messageId?: string,
  options?: QueueMediaOptions
): Promise<QueueMediaResult> {
  try {

    // Job tipini belirle
    const isVideo = sourcePath.match(/\.(mp4|mov|avi|mkv)$/i);
    const jobType = isVideo ? 'video_transcode' : 'image_optimize';

    // Edge Function üzerinden queue'ya gönder
    const response = await fetch(`${supabaseUrl}/functions/v1/queue-media-job`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_type: jobType,
        user_id: userId,
        source_path: sourcePath,
        message_id: messageId,
        preset: options?.preset || 'chat' // Preset kullan, options gönderme (worker'ın preset'i kullanmasını sağla)
      })
    });

    if (!response.ok) {
      return { message_id: 0, queued: false };
    }

    const result = await response.json();
    return { message_id: result.message_id || 0, queued: true };

  } catch (error) {
    logger.error('Queue error', error, { tag: 'MediaUpload' });
    return { message_id: 0, queued: false };
  }
}

/**
 * Upload media and queue for optimization
 * 
 * Kombine fonksiyon: Upload + Queue
 * 
 * @returns UploadResult + queue bilgisi
 */
export async function uploadMediaWithOptimization(
  uri: string,
  userId: string,
  bucket: 'post-media' | 'voice-moments' | 'stories' | 'message-media',
  accessToken: string,
  messageId?: string,
  optimizationOptions?: QueueMediaOptions
): Promise<UploadResult & { queued: boolean }> {
  // 1. Normal upload
  const uploadResult = await uploadMedia(uri, userId, bucket, accessToken);

  // 2. Queue for optimization (non-blocking)
  const queueResult = await queueMediaProcessing(
    userId,
    uploadResult.path,
    accessToken,
    messageId,
    optimizationOptions
  );

  return {
    ...uploadResult,
    queued: queueResult.queued
  };
}

/**
 * Trigger media worker manually (for testing or cron)
 */
export async function triggerMediaWorker(accessToken: string): Promise<{ processed: number; failed: number }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/media-worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Worker trigger failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    logger.error('Worker trigger error', error, { tag: 'MediaUpload' });
    throw error;
  }
}
