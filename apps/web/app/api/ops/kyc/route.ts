import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - KYC başvuruları listesi
// ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Auth kontrolü
    const {
      data: { user }
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin profil kontrolü
    const { data: adminProfile } = await adminSupabase
      .from("admin_profiles")
      .select("id, is_active")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query parametreleri
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Query
    let query = adminSupabase
      .from("kyc_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error("[KYC API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Creator profilleri
    const creatorIds = [...new Set(applications?.map((a) => a.creator_id))];
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", creatorIds)
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    // Verileri birleştir
    const enrichedApplications = applications?.map((app) => ({
      ...app,
      creator: profileMap.get(app.creator_id) || null
    }));

    // Durum sayıları
    const { data: allApps } = await adminSupabase
      .from("kyc_applications")
      .select("status");

    const counts = {
      all: allApps?.length || 0,
      pending: allApps?.filter((a) => a.status === "pending").length || 0,
      approved: allApps?.filter((a) => a.status === "approved").length || 0,
      rejected: allApps?.filter((a) => a.status === "rejected").length || 0
    };

    return NextResponse.json({
      data: enrichedApplications,
      total: count,
      limit,
      offset,
      counts
    });
  } catch (error) {
    console.error("[KYC API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
