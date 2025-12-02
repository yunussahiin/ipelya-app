import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Kur listesi
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

    // Kur listesi
    const { data: rates, error, count } = await adminSupabase
      .from("coin_rates")
      .select(
        `
        id,
        rate,
        effective_from,
        note,
        created_at,
        created_by
      `,
        { count: "exact" }
      )
      .order("effective_from", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Coin Rates API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Admin bilgilerini ekle
    const creatorIds = [...new Set(rates?.map((r) => r.created_by).filter(Boolean))];
    const { data: admins } = await adminSupabase
      .from("admin_profiles")
      .select("id, full_name, email")
      .in("id", creatorIds);

    const adminMap = new Map(admins?.map((a) => [a.id, a]));

    const enrichedRates = rates?.map((rate) => ({
      ...rate,
      created_by_admin: rate.created_by ? adminMap.get(rate.created_by) : null
    }));

    return NextResponse.json({
      data: enrichedRates,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error("[Coin Rates API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// POST - Yeni kur ekle
// ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { rate, note } = body;

    // Validasyon
    if (!rate || typeof rate !== "number" || rate <= 0) {
      return NextResponse.json(
        { error: "Geçerli bir kur değeri giriniz" },
        { status: 400 }
      );
    }

    if (rate > 100) {
      return NextResponse.json(
        { error: "Kur değeri 100 TL'den büyük olamaz" },
        { status: 400 }
      );
    }

    // Yeni kur ekle
    const { data: newRate, error } = await adminSupabase
      .from("coin_rates")
      .insert({
        rate,
        note: note || null,
        created_by: user.id,
        effective_from: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("[Coin Rates API] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newRate,
      message: "Kur başarıyla güncellendi"
    });
  } catch (error) {
    console.error("[Coin Rates API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
