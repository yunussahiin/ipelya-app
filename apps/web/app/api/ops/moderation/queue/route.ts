/**
 * Moderation Queue API Route
 *
 * GET: Get queue items with filters
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // Query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const contentType = searchParams.get("content_type");
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");

    // Build query
    let query = supabase
      .from("moderation_queue")
      .select("*", { count: "exact" })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (contentType && contentType !== "all") {
      query = query.eq("content_type", contentType);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (reason && reason !== "all") {
      query = query.eq("reason", reason);
    }

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Queue fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user info for each item
    const userIds = [...new Set(items?.map((i) => i.user_id) || [])];
    const { data: users } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("type", "real");

    const userMap = new Map(users?.map((u) => [u.user_id, u]) || []);

    // Enrich items
    const enrichedItems = items?.map((item) => ({
      ...item,
      user: userMap.get(item.user_id) || { username: "unknown" }
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
