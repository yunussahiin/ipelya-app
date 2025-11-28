/**
 * POST /api/ops/admin-chat/typing - Typing status gönder (Broadcast)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    // Auth kontrolü
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin kontrolü
    const { data: adminProfile } = await adminSupabase
      .from("profiles")
      .select("role, display_name")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { conversation_id, is_typing } = body;

    if (!conversation_id || typeof is_typing !== "boolean") {
      return NextResponse.json(
        { error: "conversation_id and is_typing are required" },
        { status: 400 }
      );
    }

    // Kullanıcının bu sohbete erişimi var mı?
    const { data: participant } = await adminSupabase
      .from("ops_conversation_participants")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("admin_id", user.id)
      .is("left_at", null)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Access denied to this conversation" }, { status: 403 });
    }

    // Supabase Realtime Broadcast ile typing status gönder
    // Not: Bu client-side'da yapılmalı, server'dan broadcast göndermek için
    // Supabase Realtime API kullanılmalı. Şimdilik sadece success dönüyoruz.
    // Client tarafında supabase.channel().send() kullanılacak.

    return NextResponse.json({
      success: true,
      data: {
        conversation_id,
        admin_id: user.id,
        admin_name: adminProfile.display_name,
        is_typing,
      },
    });
  } catch (error) {
    console.error("[AdminChat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
