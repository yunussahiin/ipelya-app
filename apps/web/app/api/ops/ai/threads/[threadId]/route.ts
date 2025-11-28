/**
 * AI Chat Thread API - Single Thread Operations
 * Tek bir konuşma için CRUD işlemleri
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

// GET - Thread detayını getir (mesajlarla birlikte)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Thread'i getir
    const { data: thread, error } = await adminSupabase
      .from("ai_chat_threads")
      .select("*")
      .eq("id", threadId)
      .eq("admin_id", user.id)
      .single();

    if (error || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("[AI Thread] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Thread güncelle (mesaj ekle, başlık değiştir, arşivle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, messages, is_archived, model } = body;

    // Güncellenecek alanları hazırla
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (messages !== undefined) updateData.messages = messages;
    if (is_archived !== undefined) updateData.is_archived = is_archived;
    if (model !== undefined) updateData.model = model;

    // Thread'i güncelle
    const { data: thread, error } = await adminSupabase
      .from("ai_chat_threads")
      .update(updateData)
      .eq("id", threadId)
      .eq("admin_id", user.id)
      .select("id, title, model, is_archived, created_at, updated_at")
      .single();

    if (error) {
      console.error("[AI Thread] Error updating thread:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("[AI Thread] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Thread sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const serverSupabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Thread'i sil
    const { error } = await adminSupabase
      .from("ai_chat_threads")
      .delete()
      .eq("id", threadId)
      .eq("admin_id", user.id);

    if (error) {
      console.error("[AI Thread] Error deleting thread:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AI Thread] Exception:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
