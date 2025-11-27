/**
 * Ops Feed Viewer API Route
 *
 * Amaç: ops-get-feed edge function'ını çağırır
 *
 * Query Params:
 * - cursor: Pagination cursor
 * - limit: Sayfa başına içerik (default: 20)
 * - content_type: post, mini_post, poll, voice_moment
 * - status: all, visible, hidden, flagged
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Session al
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = searchParams.get("limit") || "20";
    const contentType = searchParams.get("content_type");
    const status = searchParams.get("status");

    // Edge function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ops-get-feed`;

    // Build query string
    const params = new URLSearchParams();
    params.set("limit", limit);
    if (cursor) params.set("cursor", cursor);
    if (contentType) params.set("content_type", contentType);
    if (status) params.set("status", status);

    // Call edge function
    const response = await fetch(`${edgeFunctionUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Edge function error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Feed viewer API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
