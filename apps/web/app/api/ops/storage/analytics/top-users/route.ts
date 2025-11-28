import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// GET: Get top storage users
export async function GET() {
  console.log("[Top Users API] Request received");
  
  try {
    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      console.log("[Top Users API] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("[Top Users API] User authenticated:", user.id);

    // Admin client for operations
    const supabase = createAdminSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      console.log("[Top Users API] Forbidden - role:", profile?.role);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    console.log("[Top Users API] Admin access granted");

    // Get top users by storage usage using RPC
    console.log("[Top Users API] Calling get_top_storage_users RPC...");
    const { data: topUsers, error } = await supabase.rpc("get_top_storage_users", {
      limit_count: 10
    });

    if (error) {
      console.error("[Top Users API] RPC error:", error);
      // Return empty if RPC doesn't exist or fails
      return NextResponse.json({ users: [] });
    }

    console.log("[Top Users API] Success - users count:", topUsers?.length || 0);
    console.log("[Top Users API] Users data:", JSON.stringify(topUsers, null, 2));
    
    return NextResponse.json({ users: topUsers || [] });
  } catch (error) {
    console.error("[Top Users API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
