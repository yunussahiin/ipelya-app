import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Ödeme yöntemi listesi
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
      .from("payment_methods")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: methods, error, count } = await query;

    if (error) {
      console.error("[Payment Methods API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Creator profil bilgilerini al
    const creatorIds = [...new Set(methods?.map((m) => m.creator_id))];
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", creatorIds)
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    // KYC durumlarını al
    const { data: kycProfiles } = await adminSupabase
      .from("creator_kyc_profiles")
      .select("creator_id, status, level")
      .in("creator_id", creatorIds);

    const kycMap = new Map(kycProfiles?.map((k) => [k.creator_id, k]));

    // Verileri birleştir
    const enrichedMethods = methods?.map((method) => ({
      ...method,
      creator: profileMap.get(method.creator_id) || null,
      kyc: kycMap.get(method.creator_id) || null
    }));

    // Durum sayıları
    const { data: statusCounts } = await adminSupabase
      .from("payment_methods")
      .select("status");

    const counts = {
      all: statusCounts?.length || 0,
      pending: statusCounts?.filter((s) => s.status === "pending").length || 0,
      approved: statusCounts?.filter((s) => s.status === "approved").length || 0,
      rejected: statusCounts?.filter((s) => s.status === "rejected").length || 0
    };

    return NextResponse.json({
      data: enrichedMethods,
      total: count,
      limit,
      offset,
      counts
    });
  } catch (error) {
    console.error("[Payment Methods API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
