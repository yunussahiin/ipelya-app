import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  StorageBucket,
  StorageObject,
  StorageNode,
  StorageStats
} from "@ipelya/types";

// GET: List buckets and files
export async function GET(request: NextRequest) {
  try {
    // Server client for auth check (cookie-based)
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations (service role)
    const supabase = createAdminSupabaseClient();

    // Admin check - ops paneli için admin yetkisi gerekli
    // Real profile'ı kontrol et (shadow profile değil)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bucketId = searchParams.get("bucketId");
    const path = searchParams.get("path") || "";
    const includeStats = searchParams.get("stats") === "true";

    // Get all buckets from storage schema using raw SQL
    const { data: bucketsData, error: bucketsError } = await supabase
      .rpc("get_buckets_list");

    if (bucketsError) {
      console.error("Buckets error:", bucketsError);
      return NextResponse.json(
        { error: "Failed to fetch buckets" },
        { status: 500 }
      );
    }

    const buckets: StorageBucket[] = (bucketsData || []).map((b: { id: string; name: string; public: boolean; file_size_limit: number | null; allowed_mime_types: string[] | null; created_at: string; updated_at: string }) => ({
      id: b.id,
      name: b.name,
      public: b.public,
      file_size_limit: b.file_size_limit,
      allowed_mime_types: b.allowed_mime_types,
      created_at: b.created_at,
      updated_at: b.updated_at
    }));

    // If specific bucket requested, get files
    const objects: StorageObject[] = [];
    let tree: StorageNode[] = [];

    if (bucketId) {
      // List files in bucket
      const { data: filesData, error: filesError } = await supabase.storage
        .from(bucketId)
        .list(path, {
          limit: 1000,
          sortBy: { column: "name", order: "asc" }
        });

      if (filesError) {
        console.error("Files error:", filesError);
        return NextResponse.json(
          { error: "Failed to fetch files" },
          { status: 500 }
        );
      }

      // Build tree structure
      tree = buildFileTree(filesData || [], bucketId, path);
    } else {
      // Build bucket tree
      tree = buckets.map((bucket) => ({
        id: bucket.id,
        name: bucket.name,
        path: "",
        type: "bucket" as const,
        bucketId: bucket.id,
        isPublic: bucket.public,
        createdAt: bucket.created_at,
        updatedAt: bucket.updated_at,
        children: []
      }));
    }

    // Calculate stats if requested using RPC
    let stats: StorageStats | undefined;
    if (includeStats) {
      const { data: storageStats } = await supabase.rpc("get_storage_stats");
      
      if (storageStats && storageStats.length > 0) {
        const bucketStats = storageStats.map((s: { bucket_id: string; bucket_name: string; is_public: boolean; file_count: number; total_size: number }) => ({
          bucketId: s.bucket_id,
          bucketName: s.bucket_name,
          fileCount: Number(s.file_count) || 0,
          totalSize: Number(s.total_size) || 0,
          isPublic: s.is_public
        }));
        
        stats = {
          totalBuckets: buckets.length,
          totalFiles: bucketStats.reduce((sum: number, s: { fileCount: number }) => sum + s.fileCount, 0),
          totalSize: bucketStats.reduce((sum: number, s: { totalSize: number }) => sum + s.totalSize, 0),
          bucketStats
        };
      } else {
        stats = {
          totalBuckets: buckets.length,
          totalFiles: 0,
          totalSize: 0,
          bucketStats: buckets.map((b) => ({
            bucketId: b.id,
            bucketName: b.name,
            fileCount: 0,
            totalSize: 0,
            isPublic: b.public
          }))
        };
      }
    }

    return NextResponse.json({
      buckets,
      objects,
      tree,
      stats
    });
  } catch (error) {
    console.error("Storage API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: Build file tree from storage list
function buildFileTree(
  files: Array<{
    id?: string;
    name: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  }>,
  bucketId: string,
  basePath: string
): StorageNode[] {
  return files.map((file) => {
    const isFolder = !file.id || file.name.endsWith("/");
    const fullPath = basePath ? `${basePath}/${file.name}` : file.name;

    return {
      id: file.id || `folder-${file.name}`,
      name: file.name.replace(/\/$/, ""),
      path: fullPath,
      type: isFolder ? ("folder" as const) : ("file" as const),
      bucketId,
      metadata: file.metadata
        ? {
            size: (file.metadata.size as number) || 0,
            mimetype: (file.metadata.mimetype as string) || "application/octet-stream",
            cacheControl: file.metadata.cacheControl as string,
            lastModified: file.metadata.lastModified as string
          }
        : undefined,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      children: isFolder ? [] : undefined
    };
  });
}

// TODO: Implement stats calculation using RPC to access storage.objects table
