/**
 * GET /api/ops/admin-chat/admins - Tüm aktif admin'leri listele
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
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const excludeSelf = searchParams.get("exclude_self") === "true";

    // Admin'leri getir
    let query = adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, role, is_super_admin, is_active")
      .eq("type", "real")
      .eq("role", "admin")
      .eq("is_active", true)
      .order("display_name", { ascending: true });

    if (excludeSelf) {
      query = query.neq("user_id", user.id);
    }

    const { data: admins, error } = await query;

    if (error) {
      console.error("[AdminChat] Error loading admins:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Search filtresi uygula
    let filteredAdmins = admins || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAdmins = filteredAdmins.filter(
        (admin) =>
          admin.display_name?.toLowerCase().includes(searchLower) ||
          admin.username?.toLowerCase().includes(searchLower)
      );
    }

    // Response hazırla
    const enrichedAdmins = filteredAdmins.map((admin) => ({
      id: admin.user_id,
      display_name: admin.display_name,
      username: admin.username,
      avatar_url: admin.avatar_url,
      role: admin.is_super_admin ? "super_admin" : admin.role,
      is_self: admin.user_id === user.id,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedAdmins,
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
