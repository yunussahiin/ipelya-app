/**
 * Supabase Storage Types
 * Web Ops Storage Browser için type tanımları
 */

// Bucket bilgisi
export interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  created_at: string;
  updated_at: string;
}

// Storage object (dosya/klasör)
export interface StorageObject {
  id: string;
  bucket_id: string;
  name: string; // Full path (e.g., "user-id/filename.jpg")
  owner: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  metadata: StorageMetadata | null;
}

// Dosya metadata
export interface StorageMetadata {
  eTag?: string;
  size: number;
  mimetype: string;
  cacheControl?: string;
  lastModified?: string;
  contentLength?: number;
  httpStatusCode?: number;
}

// File tree node (UI için)
export interface StorageNode {
  id: string;
  name: string;
  path: string; // Full path
  type: "bucket" | "folder" | "file";
  bucketId?: string;
  metadata?: StorageMetadata;
  children?: StorageNode[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// File list response
export interface StorageListResponse {
  buckets: StorageBucket[];
  objects: StorageObject[];
  tree: StorageNode[];
}

// File operation types
export type StorageOperation =
  | "download"
  | "delete"
  | "copy_url"
  | "move"
  | "rename"
  | "preview";

// File preview info
export interface FilePreviewInfo {
  id: string;
  name: string;
  path: string;
  bucketId: string;
  url: string;
  signedUrl?: string;
  metadata: StorageMetadata;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Storage stats
export interface StorageStats {
  totalBuckets: number;
  totalFiles: number;
  totalSize: number; // bytes
  bucketStats: BucketStats[];
}

export interface BucketStats {
  bucketId: string;
  bucketName: string;
  fileCount: number;
  totalSize: number;
  isPublic: boolean;
}

// API Request/Response types
export interface ListStorageRequest {
  bucketId?: string;
  path?: string;
  limit?: number;
  offset?: number;
}

export interface DeleteFileRequest {
  bucketId: string;
  paths: string[];
}

export interface DeleteFileResponse {
  success: boolean;
  deletedCount: number;
  errors?: string[];
}

export interface GetSignedUrlRequest {
  bucketId: string;
  path: string;
  expiresIn?: number; // seconds, default 3600
}

export interface GetSignedUrlResponse {
  signedUrl: string;
  expiresAt: string;
}

// File type helpers
export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "other";

export function getFileCategory(mimetype: string): FileCategory {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (
    mimetype.includes("pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("text")
  )
    return "document";
  if (
    mimetype.includes("zip") ||
    mimetype.includes("rar") ||
    mimetype.includes("tar")
  )
    return "archive";
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}
