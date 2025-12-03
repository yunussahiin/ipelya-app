import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const KYC_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// Database row -> Frontend format
function dbToFrontend(row: Record<string, unknown>) {
  return {
    autoApproveThreshold: row.auto_approve_threshold,
    manualReviewThreshold: row.manual_review_threshold,
    autoRejectThreshold: row.auto_reject_threshold,
    weights: {
      ocrMatch: row.weight_ocr_match,
      faceDetection: row.weight_face_detection,
      liveness: row.weight_liveness,
      ocrConfidence: row.weight_ocr_confidence
    },
    enableAutoApprove: row.enable_auto_approve,
    enableAutoReject: row.enable_auto_reject,
    requireManualReviewForFirstApplication: row.require_manual_review_first_application,
    basicLevelPayoutLimit: row.basic_level_payout_limit,
    fullLevelPayoutLimit: row.full_level_payout_limit,
    maxPendingApplicationsPerUser: row.max_pending_applications_per_user,
    cooldownEnabled: row.cooldown_enabled,
    cooldownAfterRejection: row.cooldown_after_rejection_days,
    notifyOnNewApplication: row.notify_on_new_application,
    notifyOnAutoApprove: row.notify_on_auto_approve,
    notifyOnAutoReject: row.notify_on_auto_reject,
    notifyUserOnApproval: row.notify_user_on_approval,
    notifyUserOnRejection: row.notify_user_on_rejection
  };
}

// Frontend format -> Database row
function frontendToDb(settings: Record<string, unknown>) {
  const weights = settings.weights as Record<string, number>;
  return {
    auto_approve_threshold: settings.autoApproveThreshold,
    manual_review_threshold: settings.manualReviewThreshold,
    auto_reject_threshold: settings.autoRejectThreshold,
    weight_ocr_match: weights.ocrMatch,
    weight_face_detection: weights.faceDetection,
    weight_liveness: weights.liveness,
    weight_ocr_confidence: weights.ocrConfidence,
    enable_auto_approve: settings.enableAutoApprove,
    enable_auto_reject: settings.enableAutoReject,
    require_manual_review_first_application: settings.requireManualReviewForFirstApplication,
    basic_level_payout_limit: settings.basicLevelPayoutLimit,
    full_level_payout_limit: settings.fullLevelPayoutLimit,
    max_pending_applications_per_user: settings.maxPendingApplicationsPerUser,
    cooldown_enabled: settings.cooldownEnabled,
    cooldown_after_rejection_days: settings.cooldownAfterRejection,
    notify_on_new_application: settings.notifyOnNewApplication,
    notify_on_auto_approve: settings.notifyOnAutoApprove,
    notify_on_auto_reject: settings.notifyOnAutoReject,
    notify_user_on_approval: settings.notifyUserOnApproval,
    notify_user_on_rejection: settings.notifyUserOnRejection
  };
}

// GET - Load KYC settings from kyc_settings table
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("kyc_settings")
      .select("*")
      .eq("id", KYC_SETTINGS_ID)
      .single();

    if (error) {
      console.error("[KYC Settings] Error loading:", error);
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({ settings: dbToFrontend(data) });
  } catch (error) {
    console.error("[KYC Settings] Error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// POST - Save KYC settings to kyc_settings table
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json({ error: "Settings required" }, { status: 400 });
    }

    // Validate weights total
    const weights = settings.weights as Record<string, number>;
    const totalWeight =
      weights.ocrMatch + weights.faceDetection + weights.liveness + weights.ocrConfidence;

    if (totalWeight !== 100) {
      return NextResponse.json({ error: "Weights must total 100" }, { status: 400 });
    }

    // Validate threshold order
    if (
      settings.autoRejectThreshold >= settings.manualReviewThreshold ||
      settings.manualReviewThreshold >= settings.autoApproveThreshold
    ) {
      return NextResponse.json(
        { error: "Thresholds must be in order: reject < manual < approve" },
        { status: 400 }
      );
    }

    // Update settings
    const { error } = await supabase
      .from("kyc_settings")
      .update(frontendToDb(settings))
      .eq("id", KYC_SETTINGS_ID);

    if (error) {
      console.error("[KYC Settings] Error saving:", error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[KYC Settings] Error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
