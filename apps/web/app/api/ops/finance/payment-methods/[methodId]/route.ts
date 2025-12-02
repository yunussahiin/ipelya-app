import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Ödeme yöntemi detayı
// ─────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  try {
    const { methodId } = await params;
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

    // Ödeme yöntemi
    const { data: method, error } = await adminSupabase
      .from("payment_methods")
      .select("*")
      .eq("id", methodId)
      .single();

    if (error || !method) {
      return NextResponse.json({ error: "Ödeme yöntemi bulunamadı" }, { status: 404 });
    }

    // Creator profili
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("user_id", method.creator_id)
      .eq("type", "real")
      .single();

    // Auth user (email için)
    const { data: authData } = await adminSupabase.auth.admin.getUserById(method.creator_id);

    // KYC durumu
    const { data: kyc } = await adminSupabase
      .from("creator_kyc_profiles")
      .select("*")
      .eq("creator_id", method.creator_id)
      .single();

    // Diğer ödeme yöntemleri sayısı
    const { count: otherMethodsCount } = await adminSupabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", method.creator_id)
      .neq("id", methodId);

    // Reviewer bilgisi
    let reviewer = null;
    if (method.reviewed_by) {
      const { data: reviewerData } = await adminSupabase
        .from("admin_profiles")
        .select("id, full_name, email")
        .eq("id", method.reviewed_by)
        .single();
      reviewer = reviewerData;
    }

    return NextResponse.json({
      method: {
        ...method,
        reviewer
      },
      creator: profile
        ? {
            ...profile,
            email: authData?.user?.email
          }
        : null,
      kyc,
      isFirstMethod: otherMethodsCount === 0
    });
  } catch (error) {
    console.error("[Payment Method Detail] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// PATCH - Ödeme yöntemi onayla/reddet
// ─────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  try {
    const { methodId } = await params;
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
    const { action, rejectionReason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Reddetme sebebi zorunludur" },
        { status: 400 }
      );
    }

    // Mevcut yöntemi kontrol et
    const { data: method } = await adminSupabase
      .from("payment_methods")
      .select("status")
      .eq("id", methodId)
      .single();

    if (!method) {
      return NextResponse.json({ error: "Ödeme yöntemi bulunamadı" }, { status: 404 });
    }

    if (method.status !== "pending") {
      return NextResponse.json(
        { error: "Bu yöntem zaten işlenmiş" },
        { status: 400 }
      );
    }

    // Güncelle
    const updateData: Record<string, string | null> = {
      status: action === "approve" ? "approved" : "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (action === "reject") {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await adminSupabase
      .from("payment_methods")
      .update(updateData)
      .eq("id", methodId);

    if (updateError) {
      console.error("[Payment Method Update] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Ödeme yöntemi onaylandı" : "Ödeme yöntemi reddedildi"
    });
  } catch (error) {
    console.error("[Payment Method Update] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
