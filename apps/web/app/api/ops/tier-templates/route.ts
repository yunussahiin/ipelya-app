/**
 * GET /api/ops/tier-templates - Tüm tier şablonlarını getir
 * POST /api/ops/tier-templates - Yeni şablon ekle
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
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const withBenefits = searchParams.get("withBenefits") !== "false";

    // Şablonları getir
    let query = adminSupabase
      .from("tier_templates")
      .select("*")
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("[TierTemplates] Error loading templates:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Avantaj detaylarını getir (eğer isteniyorsa)
    let benefitsMap: Map<string, unknown> = new Map();
    if (withBenefits && templates && templates.length > 0) {
      // Tüm benefit ID'lerini topla
      const allBenefitIds = new Set<string>();
      templates.forEach((t) => {
        (t.default_benefit_ids || []).forEach((id: string) => allBenefitIds.add(id));
      });

      if (allBenefitIds.size > 0) {
        const { data: benefits } = await adminSupabase
          .from("tier_benefits")
          .select("*")
          .in("id", Array.from(allBenefitIds));

        benefitsMap = new Map(benefits?.map((b) => [b.id, b]) || []);
      }
    }

    // Şablonları zenginleştir
    const enrichedTemplates = templates?.map((template) => ({
      ...template,
      benefits: withBenefits
        ? (template.default_benefit_ids || [])
            .map((id: string) => benefitsMap.get(id))
            .filter(Boolean)
        : undefined,
    }));

    return NextResponse.json({
      success: true,
      templates: enrichedTemplates,
      total: templates?.length || 0,
    });
  } catch (error) {
    console.error("[TierTemplates] Error:", error);
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
    const requiredFields = [
      "id",
      "name",
      "suggested_coin_price_monthly",
      "emoji",
      "color",
      "gradient_start",
      "gradient_end",
    ];
    const missingFields = requiredFields.filter((f) => !body[f]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Zorunlu alanlar eksik: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // recommended_for validasyonu (eğer verilmişse)
    if (
      body.recommended_for &&
      !["beginner", "intermediate", "advanced", "premium"].includes(body.recommended_for)
    ) {
      return NextResponse.json(
        { error: "recommended_for 'beginner', 'intermediate', 'advanced' veya 'premium' olmalıdır" },
        { status: 400 }
      );
    }

    // Yeni şablon ekle
    const { data: template, error } = await adminSupabase
      .from("tier_templates")
      .insert({
        id: body.id,
        name: body.name,
        description: body.description || null,
        suggested_coin_price_monthly: body.suggested_coin_price_monthly,
        suggested_coin_price_yearly: body.suggested_coin_price_yearly || null,
        emoji: body.emoji,
        color: body.color,
        gradient_start: body.gradient_start,
        gradient_end: body.gradient_end,
        default_benefit_ids: body.default_benefit_ids || [],
        recommended_for: body.recommended_for || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("[TierTemplates] Error creating template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("[TierTemplates] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
