import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Ödeme talepleri listesi
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
      .from("payout_requests")
      .select(
        `
        *,
        payment_methods (
          id,
          type,
          bank_name,
          iban,
          crypto_network,
          wallet_address
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: requests, error, count } = await query;

    if (error) {
      console.error("[Payout Requests API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Creator profilleri
    const creatorIds = [...new Set(requests?.map((r) => r.creator_id))];
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", creatorIds)
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    // Verileri birleştir
    const enrichedRequests = requests?.map((req) => ({
      ...req,
      creator: profileMap.get(req.creator_id) || null
    }));

    // Durum sayıları
    const { data: allRequests } = await adminSupabase
      .from("payout_requests")
      .select("status");

    const counts = {
      all: allRequests?.length || 0,
      pending: allRequests?.filter((r) => r.status === "pending").length || 0,
      in_review: allRequests?.filter((r) => r.status === "in_review").length || 0,
      approved: allRequests?.filter((r) => r.status === "approved").length || 0,
      paid: allRequests?.filter((r) => r.status === "paid").length || 0,
      rejected: allRequests?.filter((r) => r.status === "rejected").length || 0
    };

    // Bugünkü özet
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRequests = allRequests?.filter(
      (r) => new Date(r.created_at) >= today
    );

    const { data: todayPaid } = await adminSupabase
      .from("payout_requests")
      .select("tl_amount")
      .eq("status", "paid")
      .gte("paid_at", today.toISOString());

    const todaySummary = {
      pending: {
        count: todayRequests?.filter((r) => r.status === "pending").length || 0,
        amount: 0 // Hesaplanacak
      },
      approved: {
        count: todayRequests?.filter((r) => r.status === "approved").length || 0,
        amount: 0
      },
      paid: {
        count: todayPaid?.length || 0,
        amount: todayPaid?.reduce((sum, r) => sum + Number(r.tl_amount || 0), 0) || 0
      }
    };

    return NextResponse.json({
      data: enrichedRequests,
      total: count,
      limit,
      offset,
      counts,
      todaySummary
    });
  } catch (error) {
    console.error("[Payout Requests API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
