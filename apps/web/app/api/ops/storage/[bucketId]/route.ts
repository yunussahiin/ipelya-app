import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: List files in a specific bucket/path
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations
    const supabase = createAdminSupabaseClient();
    const { bucketId } = await params;

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
    const path = searchParams.get("path") || "";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // List files in bucket
    const { data: files, error } = await supabase.storage
      .from(bucketId)
      .list(path, {
        limit,
        offset,
        sortBy: { column: "name", order: "asc" }
      });

    if (error) {
      console.error("List files error:", error);
      return NextResponse.json(
        { error: "Failed to list files" },
        { status: 500 }
      );
    }

    // Get bucket info using RPC
    const { data: bucketData } = await supabase.rpc("get_buckets_list");
    const bucket = bucketData?.find((b: { id: string }) => b.id === bucketId);

    // Collect all UUIDs from file paths and names
    const uuids = new Set<string>();
    (files || []).forEach((file) => {
      // Check file name and path for UUIDs
      const matches = (path + "/" + file.name).match(UUID_REGEX);
      if (matches) {
        uuids.add(matches[0].toLowerCase());
      }
      // Also check folder names in path
      const pathParts = (path + "/" + file.name).split("/");
      pathParts.forEach((part) => {
        if (UUID_REGEX.test(part)) {
          uuids.add(part.toLowerCase());
        }
      });
    });

    // Fetch user info for all UUIDs
    const userMap: Record<string, { username: string; email: string; avatar_url: string | null; role: string }> = {};
    if (uuids.size > 0) {
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, username, email, avatar_url, role, type")
        .in("user_id", Array.from(uuids))
        .eq("type", "real");

      if (users) {
        users.forEach((u) => {
          userMap[u.user_id] = {
            username: u.username,
            email: u.email,
            avatar_url: u.avatar_url,
            role: u.role
          };
        });
      }
    }

    // Transform files with public URLs and user info
    const filesWithUrls = (files || []).map((file) => {
      const fullPath = path ? `${path}/${file.name}` : file.name;
      const isFolder = !file.id;

      let publicUrl = null;
      if (!isFolder && bucket?.public) {
        const { data } = supabase.storage.from(bucketId).getPublicUrl(fullPath);
        publicUrl = data.publicUrl;
      }

      // Find user ID in path
      let owner = null;
      const pathParts = fullPath.split("/");
      for (const part of pathParts) {
        if (UUID_REGEX.test(part) && userMap[part.toLowerCase()]) {
          owner = userMap[part.toLowerCase()];
          break;
        }
      }

      return {
        ...file,
        fullPath,
        isFolder,
        publicUrl,
        bucketId,
        owner
      };
    });

    return NextResponse.json({
      files: filesWithUrls,
      bucket,
      path,
      hasMore: files?.length === limit,
      userMap
    });
  } catch (error) {
    console.error("Storage bucket API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete files from bucket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations
    const supabase = createAdminSupabaseClient();
    const { bucketId } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { paths } = body as { paths: string[] };

    if (!paths || paths.length === 0) {
      return NextResponse.json(
        { error: "No paths provided" },
        { status: 400 }
      );
    }

    // Delete files
    const { data, error } = await supabase.storage
      .from(bucketId)
      .remove(paths);

    if (error) {
      console.error("Delete files error:", error);
      return NextResponse.json(
        { error: "Failed to delete files" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || 0,
      deletedPaths: paths
    });
  } catch (error) {
    console.error("Storage delete API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
