import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Creator bakiye listesi
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "total_earned";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Creator bakiyeleri
    let query = adminSupabase
      .from("creator_balances")
      .select(
        `
        creator_id,
        total_earned,
        total_withdrawn,
        pending_payout,
        available_balance,
        last_transaction_at,
        updated_at
      `,
        { count: "exact" }
      );

    // Sıralama
    if (["total_earned", "available_balance", "pending_payout", "total_withdrawn"].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: balances, error, count } = await query;

    if (error) {
      console.error("[Creator Balances API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Creator profil bilgilerini al
    const creatorIds = balances?.map((b) => b.creator_id) || [];

    let profileQuery = adminSupabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url, type")
      .in("user_id", creatorIds)
      .eq("type", "real");

    if (search) {
      profileQuery = profileQuery.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data: profiles } = await profileQuery;
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    // KYC durumlarını al
    const { data: kycProfiles } = await adminSupabase
      .from("creator_kyc_profiles")
      .select("creator_id, status, level")
      .in("creator_id", creatorIds);

    const kycMap = new Map(kycProfiles?.map((k) => [k.creator_id, k]));

    // Ödeme yöntemi durumlarını al
    const { data: paymentMethods } = await adminSupabase
      .from("payment_methods")
      .select("creator_id, status")
      .in("creator_id", creatorIds)
      .eq("status", "approved");

    const hasApprovedMethod = new Set(paymentMethods?.map((p) => p.creator_id));

    // Bekleyen talepleri kontrol et
    const { data: pendingRequests } = await adminSupabase
      .from("payout_requests")
      .select("creator_id")
      .in("creator_id", creatorIds)
      .in("status", ["pending", "in_review"]);

    const hasPendingRequest = new Set(pendingRequests?.map((p) => p.creator_id));

    // Verileri birleştir
    const enrichedBalances = balances
      ?.map((balance) => {
        const profile = profileMap.get(balance.creator_id);
        if (!profile && search) return null; // Arama sonucunda profil yoksa exclude et

        const kyc = kycMap.get(balance.creator_id);
        const hasMethod = hasApprovedMethod.has(balance.creator_id);
        const hasPending = hasPendingRequest.has(balance.creator_id);

        // Durum belirleme
        let status: "ok" | "warning" | "error" = "ok";
        if (!hasMethod) status = "error";
        else if (hasPending) status = "warning";

        return {
          ...balance,
          profile: profile || null,
          kyc: kyc || null,
          status,
          hasApprovedPaymentMethod: hasMethod,
          hasPendingRequest: hasPending
        };
      })
      .filter(Boolean);

    // Güncel kur
    const { data: currentRate } = await adminSupabase
      .from("coin_rates")
      .select("rate")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      data: enrichedBalances,
      total: count,
      limit,
      offset,
      currentRate: currentRate?.rate || 0.5
    });
  } catch (error) {
    console.error("[Creator Balances API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
