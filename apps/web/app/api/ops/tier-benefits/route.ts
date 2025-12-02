/**
 * GET /api/ops/tier-benefits - Tüm avantajları getir
 * POST /api/ops/tier-benefits - Yeni avantaj ekle
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Auth kontrolü
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
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
    const category = searchParams.get("category"); // content, communication, perks
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // Avantajları getir
    let query = adminSupabase
      .from("tier_benefits")
      .select("*")
      .order("sort_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: benefits, error } = await query;

    if (error) {
      console.error("[TierBenefits] Error loading benefits:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Kategorilere göre grupla
    const grouped = {
      content: benefits?.filter((b) => b.category === "content") || [],
      communication:
        benefits?.filter((b) => b.category === "communication") || [],
      perks: benefits?.filter((b) => b.category === "perks") || [],
    };

    return NextResponse.json({
      success: true,
      benefits,
      grouped,
      total: benefits?.length || 0,
    });
  } catch (error) {
    console.error("[TierBenefits] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Auth kontrolü
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
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

    const body = await request.json();

    // Zorunlu alanları kontrol et
    if (!body.id || !body.name || !body.description || !body.emoji || !body.category) {
      return NextResponse.json(
        { error: "id, name, description, emoji ve category zorunludur" },
        { status: 400 }
      );
    }

    // Kategori validasyonu
    if (!["content", "communication", "perks"].includes(body.category)) {
      return NextResponse.json(
        { error: "category 'content', 'communication' veya 'perks' olmalıdır" },
        { status: 400 }
      );
    }

    // Yeni avantaj ekle
    const { data: benefit, error } = await adminSupabase
      .from("tier_benefits")
      .insert({
        id: body.id,
        name: body.name,
        description: body.description,
        emoji: body.emoji,
        category: body.category,
        has_limit: body.has_limit || false,
        limit_type: body.limit_type || null,
        recommended_tier_level: body.recommended_tier_level || null,
        is_active: body.is_active ?? true,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[TierBenefits] Error creating benefit:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      benefit,
    });
  } catch (error) {
    console.error("[TierBenefits] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
