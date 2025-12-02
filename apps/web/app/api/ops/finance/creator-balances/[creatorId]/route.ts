import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Creator bakiye detayı
// ─────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params;
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

    // Creator bakiyesi
    const { data: balance, error: balanceError } = await adminSupabase
      .from("creator_balances")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (balanceError && balanceError.code !== "PGRST116") {
      console.error("[Creator Balance Detail] Error:", balanceError);
      return NextResponse.json({ error: balanceError.message }, { status: 500 });
    }

    // Creator profili
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url, type, created_at")
      .eq("user_id", creatorId)
      .eq("type", "real")
      .single();

    // Auth user bilgileri (email için)
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(creatorId);

    // KYC durumu
    const { data: kyc } = await adminSupabase
      .from("creator_kyc_profiles")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    // Ödeme yöntemleri
    const { data: paymentMethods } = await adminSupabase
      .from("payment_methods")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("status", "approved");

    // Son işlemler
    const { data: transactions } = await adminSupabase
      .from("creator_transactions")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Bekleyen talepler
    const { data: pendingRequests } = await adminSupabase
      .from("payout_requests")
      .select("*")
      .eq("creator_id", creatorId)
      .in("status", ["pending", "in_review"]);

    // Güncel kur
    const { data: currentRate } = await adminSupabase
      .from("coin_rates")
      .select("rate")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    // Son 6 ay gelir verisi (grafik için)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData } = await adminSupabase
      .from("creator_transactions")
      .select("type, amount, created_at")
      .eq("creator_id", creatorId)
      .gte("created_at", sixMonthsAgo.toISOString())
      .in("type", ["subscription", "gift", "ppv"]);

    // Aylık veri grupla
    const monthlyStats = new Map<string, { subscription: number; gift: number; ppv: number }>();
    monthlyData?.forEach((tx) => {
      const month = new Date(tx.created_at).toISOString().slice(0, 7);
      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { subscription: 0, gift: 0, ppv: 0 });
      }
      const stats = monthlyStats.get(month)!;
      if (tx.type === "subscription") stats.subscription += tx.amount;
      else if (tx.type === "gift") stats.gift += tx.amount;
      else if (tx.type === "ppv") stats.ppv += tx.amount;
    });

    const chartData = Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({
        month,
        ...stats,
        total: stats.subscription + stats.gift + stats.ppv
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      balance: balance || {
        creator_id: creatorId,
        total_earned: 0,
        total_withdrawn: 0,
        pending_payout: 0,
        available_balance: 0
      },
      profile: profile
        ? {
            ...profile,
            email: authUser?.user?.email
          }
        : null,
      kyc,
      paymentMethods: paymentMethods || [],
      transactions: transactions || [],
      pendingRequests: pendingRequests || [],
      chartData,
      currentRate: currentRate?.rate || 0.5
    });
  } catch (error) {
    console.error("[Creator Balance Detail] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
