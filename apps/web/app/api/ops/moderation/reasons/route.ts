/**
 * Moderation Reasons API Route
 * GET: Moderasyon neden şablonlarını getir
 */

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Admin kontrolü
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id, is_active")
      .eq("id", session.user.id)
      .single();

    if (!adminProfile?.is_active) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Neden şablonlarını getir
    const { data: reasons, error } = await supabase
      .from("moderation_reason_templates")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: reasons });
  } catch (error) {
    console.error("Moderation reasons error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
