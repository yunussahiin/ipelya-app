/**
 * GET /api/ops/messaging/users/search
 * Kullanıcı ara (Admin için - impersonation)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Auth kontrolü
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin kontrolü
    const { data: adminProfile } = await adminSupabase
      .from("admin_profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Kullanıcıları ara (admin olmayanlar)
    const { data: users, error } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, is_creator, is_verified, role")
      .eq("type", "real")
      .neq("role", "admin")
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error("[User Search] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    console.error("[User Search] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
