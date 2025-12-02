import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - KYC başvuru detayı
// ─────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
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

    // KYC başvurusu
    const { data: application, error } = await adminSupabase
      .from("kyc_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
    }

    // Creator profili
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("user_id", application.creator_id)
      .eq("type", "real")
      .single();

    // Auth user (email için)
    const { data: authData } = await adminSupabase.auth.admin.getUserById(
      application.creator_id
    );

    // Signed URLs oluştur (belgeler için)
    const signedUrls: Record<string, string> = {};

    if (application.id_front_path) {
      const { data: frontUrl } = await adminSupabase.storage
        .from("kyc-documents")
        .createSignedUrl(application.id_front_path, 3600);
      if (frontUrl) signedUrls.idFront = frontUrl.signedUrl;
    }

    if (application.id_back_path) {
      const { data: backUrl } = await adminSupabase.storage
        .from("kyc-documents")
        .createSignedUrl(application.id_back_path, 3600);
      if (backUrl) signedUrls.idBack = backUrl.signedUrl;
    }

    if (application.selfie_path) {
      const { data: selfieUrl } = await adminSupabase.storage
        .from("kyc-documents")
        .createSignedUrl(application.selfie_path, 3600);
      if (selfieUrl) signedUrls.selfie = selfieUrl.signedUrl;
    }

    // Reviewer bilgisi
    let reviewer = null;
    if (application.reviewed_by) {
      const { data: reviewerData } = await adminSupabase
        .from("admin_profiles")
        .select("id, full_name, email")
        .eq("id", application.reviewed_by)
        .single();
      reviewer = reviewerData;
    }

    return NextResponse.json({
      application: {
        ...application,
        reviewer
      },
      creator: profile
        ? {
            ...profile,
            email: authData?.user?.email
          }
        : null,
      signedUrls
    });
  } catch (error) {
    console.error("[KYC Detail] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// PATCH - KYC başvurusunu onayla/reddet
// ─────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
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
    const { action, rejectionReason, internalNotes } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Reddetme sebebi zorunludur" },
        { status: 400 }
      );
    }

    // Mevcut başvuruyu kontrol et
    const { data: application } = await adminSupabase
      .from("kyc_applications")
      .select("status")
      .eq("id", applicationId)
      .single();

    if (!application) {
      return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Bu başvuru zaten işlenmiş" },
        { status: 400 }
      );
    }

    // Güncelleme verisi
    const updateData: Record<string, string | null> = {
      status: action === "approve" ? "approved" : "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (action === "reject") {
      updateData.rejection_reason = rejectionReason;
    }

    if (internalNotes) {
      updateData.internal_notes = internalNotes;
    }

    // Başvuruyu güncelle
    const { error: updateError } = await adminSupabase
      .from("kyc_applications")
      .update(updateData)
      .eq("id", applicationId);

    if (updateError) {
      console.error("[KYC Update] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Onaylandıysa creator_kyc_profiles tablosunu güncelle (trigger ile de yapılabilir)
    // Bu kısım trigger'da yapılıyor - 05-DATABASE-SCHEMA.md'ye göre

    return NextResponse.json({
      success: true,
      message:
        action === "approve" ? "KYC başvurusu onaylandı" : "KYC başvurusu reddedildi"
    });
  } catch (error) {
    console.error("[KYC Update] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
