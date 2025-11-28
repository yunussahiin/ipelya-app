/**
 * AI Chat Threads API
 * Konuşma geçmişi CRUD işlemleri
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// GET - Tüm thread'leri listele
export async function GET() {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();
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

    // Thread'leri getir
    const { data: threads, error } = await adminSupabase
      .from("ai_chat_threads")
      .select("id, title, model, is_archived, created_at, updated_at")
      .eq("admin_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[AI Threads] Error fetching threads:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ threads: threads || [] });
  } catch (error) {
    console.error("[AI Threads] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Yeni thread oluştur
export async function POST(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();
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
    const { title, model } = body;

    // Yeni thread oluştur
    const { data: thread, error } = await adminSupabase
      .from("ai_chat_threads")
      .insert({
        admin_id: user.id,
        title: title || null,
        model: model || null,
        messages: []
      })
      .select("id, title, model, is_archived, created_at, updated_at")
      .single();

    if (error) {
      console.error("[AI Threads] Error creating thread:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("[AI Threads] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
