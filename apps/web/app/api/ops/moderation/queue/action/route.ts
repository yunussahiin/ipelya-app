/**
 * Moderation Queue Action API Route
 *
 * POST: Approve, reject, or escalate queue items
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authorization
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", session.user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { ids, action, note } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    if (!["approve", "reject", "escalate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Map action to status
    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      escalate: "escalated"
    };

    // Update queue items
    const { error: updateError } = await supabase
      .from("moderation_queue")
      .update({
        status: statusMap[action],
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        notes: note || null
      })
      .in("id", ids);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If rejected, also moderate the content
    if (action === "reject") {
      // Get queue items to find content
      const { data: queueItems } = await supabase
        .from("moderation_queue")
        .select("content_type, content_id, user_id")
        .in("id", ids);

      // Hide each content
      for (const item of queueItems || []) {
        const tableName = item.content_type === "mini_post" ? "mini_posts" : `${item.content_type}s`;
        
        await supabase
          .from(tableName)
          .update({ is_hidden: true })
          .eq("id", item.content_id);

        // Log moderation action
        await supabase.from("moderation_actions").insert({
          admin_id: session.user.id,
          target_type: item.content_type,
          target_id: item.content_id,
          target_user_id: item.user_id,
          action_type: "hide",
          reason_code: "queue_rejected",
          admin_note: note || "Moderation queue'dan reddedildi"
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: ids.length,
        action
      }
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
