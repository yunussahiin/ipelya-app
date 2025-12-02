/**
 * PATCH /api/ops/tier-templates/[id] - Şablon güncelle
 * DELETE /api/ops/tier-templates/[id] - Şablon devre dışı bırak (soft delete)
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

    // recommended_for validasyonu (eğer güncellenmişse)
    if (
      body.recommended_for &&
      !["beginner", "intermediate", "advanced", "premium"].includes(body.recommended_for)
    ) {
      return NextResponse.json(
        { error: "recommended_for 'beginner', 'intermediate', 'advanced' veya 'premium' olmalıdır" },
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
      "suggested_coin_price_monthly",
      "suggested_coin_price_yearly",
      "emoji",
      "color",
      "gradient_start",
      "gradient_end",
      "default_benefit_ids",
      "recommended_for",
      "sort_order",
      "is_active",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Şablonu güncelle
    const { data: template, error } = await adminSupabase
      .from("tier_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[TierTemplates] Error updating template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
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
      .from("tier_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[TierTemplates] Error deleting template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Şablon devre dışı bırakıldı",
    });
  } catch (error) {
    console.error("[TierTemplates] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
