/**
 * Media Upload Service
 * 
 * Supabase Storage'a media upload işlemleri
 */

import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';

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
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    const mediaType = getMediaType(uri);
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
    if (uri.toLowerCase().includes('.heic')) {
      contentType = 'image/jpeg';
    }

    // Generate filename
    const fileName = generateFileName(uri.split('/').pop() || 'file', userId);

    // Upload using Expo FileSystem (most reliable for React Native)
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
    
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: contentType, // Force JPEG for HEIC
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (uploadResult.status !== 200) {
      console.error('Upload error details:', uploadResult.body);
      throw new Error(`Upload failed: ${uploadResult.status} - ${uploadResult.body}`);
    }

    console.log('✅ Upload success:', uploadResult.body);
    const data = JSON.parse(uploadResult.body);
    console.log('📦 Parsed data:', data);

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
    console.error('❌ Media upload error:', error);
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
