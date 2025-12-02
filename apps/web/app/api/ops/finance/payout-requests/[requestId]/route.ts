import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────
// GET - Ödeme talebi detayı
// ─────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
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

    // Ödeme talebi
    const { data: request, error } = await adminSupabase
      .from("payout_requests")
      .select(
        `
        *,
        payment_methods (*)
      `
      )
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    // Creator profili
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("user_id", request.creator_id)
      .eq("type", "real")
      .single();

    // Auth user (email için)
    const { data: authData } = await adminSupabase.auth.admin.getUserById(request.creator_id);

    // Creator bakiyesi
    const { data: balance } = await adminSupabase
      .from("creator_balances")
      .select("*")
      .eq("creator_id", request.creator_id)
      .single();

    // Durum geçmişi
    const { data: statusHistory } = await adminSupabase
      .from("payout_status_history")
      .select("*")
      .eq("payout_request_id", requestId)
      .order("created_at", { ascending: false });

    // Admin bilgilerini al
    const adminIds = [
      ...(statusHistory?.map((h) => h.changed_by).filter(Boolean) || []),
      request.reviewed_by
    ].filter(Boolean);

    const { data: admins } = await adminSupabase
      .from("admin_profiles")
      .select("id, full_name, email")
      .in("id", adminIds);

    const adminMap = new Map(admins?.map((a) => [a.id, a]));

    // Durum geçmişini zenginleştir
    const enrichedHistory = statusHistory?.map((h) => ({
      ...h,
      changed_by_admin: h.changed_by ? adminMap.get(h.changed_by) : null
    }));

    // Diğer bekleyen talepler
    const { data: otherPending } = await adminSupabase
      .from("payout_requests")
      .select("id, coin_amount")
      .eq("creator_id", request.creator_id)
      .neq("id", requestId)
      .in("status", ["pending", "in_review", "approved"]);

    return NextResponse.json({
      request: {
        ...request,
        reviewer: request.reviewed_by ? adminMap.get(request.reviewed_by) : null
      },
      creator: profile
        ? {
            ...profile,
            email: authData?.user?.email
          }
        : null,
      balance,
      statusHistory: enrichedHistory || [],
      otherPendingRequests: otherPending || []
    });
  } catch (error) {
    console.error("[Payout Request Detail] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// PATCH - Ödeme talebi durumunu güncelle
// ─────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
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
    const { action, rejectionReason, paymentReference, note } = body;

    const validActions = ["in_review", "approve", "paid", "reject"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Reddetme sebebi zorunludur" },
        { status: 400 }
      );
    }

    // Mevcut talebi kontrol et
    const { data: currentRequest } = await adminSupabase
      .from("payout_requests")
      .select("status, creator_id, coin_amount")
      .eq("id", requestId)
      .single();

    if (!currentRequest) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    // Durum geçiş kontrolü
    const validTransitions: Record<string, string[]> = {
      pending: ["in_review", "reject"],
      in_review: ["approve", "reject"],
      approved: ["paid", "reject"]
    };

    const allowedNextStatuses = validTransitions[currentRequest.status] || [];
    const newStatus =
      action === "approve"
        ? "approved"
        : action === "paid"
          ? "paid"
          : action === "reject"
            ? "rejected"
            : action;

    if (!allowedNextStatuses.includes(newStatus) && !allowedNextStatuses.includes(action)) {
      return NextResponse.json(
        { error: `${currentRequest.status} durumundan ${newStatus} durumuna geçiş yapılamaz` },
        { status: 400 }
      );
    }

    // Güncelleme verisi
    const updateData: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (["approved", "rejected"].includes(newStatus)) {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (newStatus === "rejected") {
      updateData.rejection_reason = rejectionReason;
    }

    if (newStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
      if (paymentReference) {
        updateData.payment_reference = paymentReference;
      }
    }

    if (note) {
      updateData.internal_notes = note;
    }

    // Talebi güncelle
    const { error: updateError } = await adminSupabase
      .from("payout_requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[Payout Request Update] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Durum geçmişine ekle
    await adminSupabase.from("payout_status_history").insert({
      payout_request_id: requestId,
      status: newStatus,
      changed_by: user.id,
      note: note || null
    });

    // Reddedilirse veya ödendiyse bakiyeyi güncelle
    if (newStatus === "rejected") {
      // Kilitli bakiyeyi geri ver
      await adminSupabase
        .from("creator_balances")
        .update({
          pending_payout: adminSupabase.rpc("decrement_pending", {
            amount: currentRequest.coin_amount
          }),
          updated_at: new Date().toISOString()
        })
        .eq("creator_id", currentRequest.creator_id);
    }

    if (newStatus === "paid") {
      // Çekilen bakiyeyi güncelle
      const { data: balance } = await adminSupabase
        .from("creator_balances")
        .select("pending_payout, total_withdrawn")
        .eq("creator_id", currentRequest.creator_id)
        .single();

      if (balance) {
        await adminSupabase
          .from("creator_balances")
          .update({
            pending_payout: Math.max(0, balance.pending_payout - currentRequest.coin_amount),
            total_withdrawn: balance.total_withdrawn + currentRequest.coin_amount,
            updated_at: new Date().toISOString()
          })
          .eq("creator_id", currentRequest.creator_id);
      }
    }

    const statusLabels: Record<string, string> = {
      in_review: "incelemeye alındı",
      approved: "onaylandı",
      paid: "ödendi olarak işaretlendi",
      rejected: "reddedildi"
    };

    return NextResponse.json({
      success: true,
      message: `Talep ${statusLabels[newStatus]}`
    });
  } catch (error) {
    console.error("[Payout Request Update] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
