import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// POST - Manuel bakiye düzeltmesi
// ─────────────────────────────────────────────────────────

export async function POST(
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

    const body = await request.json();
    const { type, amount, reason } = body;

    // Validasyon
    if (!type || !["add", "subtract"].includes(type)) {
      return NextResponse.json(
        { error: "Geçersiz işlem tipi" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir miktar giriniz" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Düzeltme sebebi zorunludur (min 5 karakter)" },
        { status: 400 }
      );
    }

    // Creator bakiyesini kontrol et
    const { data: balance } = await adminSupabase
      .from("creator_balances")
      .select("available_balance, total_earned, total_withdrawn")
      .eq("creator_id", creatorId)
      .single();

    // Çıkarma işleminde bakiye kontrolü
    if (type === "subtract") {
      const availableBalance = balance?.available_balance || 0;
      if (amount > availableBalance) {
        return NextResponse.json(
          { error: `Yetersiz bakiye. Mevcut: ${availableBalance} coin` },
          { status: 400 }
        );
      }
    }

    // Güncel kur
    const { data: currentRate } = await adminSupabase
      .from("coin_rates")
      .select("rate")
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    const rate = currentRate?.rate || 0.5;
    const coinAmount = type === "add" ? amount : -amount;

    // Transaction oluştur
    const { data: transaction, error: txError } = await adminSupabase
      .from("creator_transactions")
      .insert({
        creator_id: creatorId,
        type: "adjustment",
        amount: coinAmount,
        rate_at_time: rate,
        tl_equivalent: Math.abs(coinAmount) * rate,
        description: `Manuel düzeltme: ${type === "add" ? "Ekleme" : "Çıkarma"}`,
        adjustment_reason: reason,
        created_by: user.id
      })
      .select()
      .single();

    if (txError) {
      console.error("[Balance Adjustment] Transaction error:", txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // Bakiyeyi güncelle
    if (balance) {
      // Mevcut bakiye varsa güncelle
      const { error: updateError } = await adminSupabase
        .from("creator_balances")
        .update({
          total_earned:
            type === "add"
              ? (balance.total_earned || 0) + amount
              : balance.total_earned || 0,
          total_withdrawn:
            type === "subtract"
              ? (balance.total_withdrawn || 0) + amount
              : balance.total_withdrawn || 0,
          last_transaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("creator_id", creatorId);

      if (updateError) {
        console.error("[Balance Adjustment] Update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // Bakiye yoksa oluştur
      const { error: insertError } = await adminSupabase
        .from("creator_balances")
        .insert({
          creator_id: creatorId,
          total_earned: type === "add" ? amount : 0,
          total_withdrawn: type === "subtract" ? amount : 0,
          pending_payout: 0,
          last_transaction_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("[Balance Adjustment] Insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: `${Math.abs(coinAmount)} coin ${type === "add" ? "eklendi" : "çıkarıldı"}`
    });
  } catch (error) {
    console.error("[Balance Adjustment] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
