import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// GET: Get user storage details by bucket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  console.log("[User Storage API] Request received");
  
  try {
    const { userId } = await params;
    console.log("[User Storage API] Target user:", userId);

    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      console.log("[User Storage API] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations
    const supabase = createAdminSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      console.log("[User Storage API] Forbidden - role:", profile?.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user info
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("user_id, username, email, avatar_url, role")
      .eq("user_id", userId)
      .eq("type", "real")
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user storage by bucket using RPC
    console.log("[User Storage API] Calling get_user_storage_by_bucket RPC...");
    const { data: bucketStats, error } = await supabase.rpc("get_user_storage_by_bucket", {
      target_user_id: userId
    });

    if (error) {
      console.error("[User Storage API] RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate totals
    const totalFiles = bucketStats?.reduce((sum: number, b: { file_count: number }) => sum + Number(b.file_count), 0) || 0;
    const totalSize = bucketStats?.reduce((sum: number, b: { total_size: number }) => sum + Number(b.total_size), 0) || 0;

    console.log("[User Storage API] Success - buckets:", bucketStats?.length || 0);
    
    return NextResponse.json({
      user: targetUser,
      bucketStats: bucketStats || [],
      totals: {
        files: totalFiles,
        size: totalSize
      }
    });
  } catch (error) {
    console.error("[User Storage API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
