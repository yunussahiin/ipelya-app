/**
 * PATCH /api/ops/tier-benefits/[id] - Avantaj güncelle
 * DELETE /api/ops/tier-benefits/[id] - Avantaj devre dışı bırak (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const { id } = await params;

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

    // Kategori validasyonu (eğer güncellenmişse)
    if (body.category && !["content", "communication", "perks"].includes(body.category)) {
      return NextResponse.json(
        { error: "category 'content', 'communication' veya 'perks' olmalıdır" },
        { status: 400 }
      );
    }

    // limit_type validasyonu (eğer güncellenmişse)
    if (body.limit_type && !["daily", "weekly", "monthly", "yearly"].includes(body.limit_type)) {
      return NextResponse.json(
        { error: "limit_type 'daily', 'weekly', 'monthly' veya 'yearly' olmalıdır" },
        { status: 400 }
      );
    }

    // recommended_tier_level validasyonu (eğer güncellenmişse)
    if (
      body.recommended_tier_level &&
      !["bronze", "silver", "gold", "diamond", "vip"].includes(body.recommended_tier_level)
    ) {
      return NextResponse.json(
        { error: "recommended_tier_level 'bronze', 'silver', 'gold', 'diamond' veya 'vip' olmalıdır" },
        { status: 400 }
      );
    }

    // Güncelleme verisi hazırla
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Sadece gönderilen alanları güncelle
    const allowedFields = [
      "name",
      "description",
      "emoji",
      "category",
      "has_limit",
      "limit_type",
      "recommended_tier_level",
      "is_active",
      "sort_order",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Avantajı güncelle
    const { data: benefit, error } = await adminSupabase
      .from("tier_benefits")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[TierBenefits] Error updating benefit:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!benefit) {
      return NextResponse.json({ error: "Avantaj bulunamadı" }, { status: 404 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const { id } = await params;

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

    // Soft delete - is_active = false
    const { error } = await adminSupabase
      .from("tier_benefits")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[TierBenefits] Error deleting benefit:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Avantaj devre dışı bırakıldı",
    });
  } catch (error) {
    console.error("[TierBenefits] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
