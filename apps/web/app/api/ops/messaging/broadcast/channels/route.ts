/**
 * GET /api/ops/messaging/broadcast/channels
 * Tüm broadcast kanallarını listele (Admin için)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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
      .select("role")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const accessType = searchParams.get("access_type"); // free, paid, subscription
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Kanalları getir
    let query = adminSupabase
      .from("broadcast_channels")
      .select(`
        id,
        name,
        description,
        avatar_url,
        creator_id,
        access_type,
        member_count,
        message_count,
        is_active,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (accessType) {
      query = query.eq("access_type", accessType);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: channels, error } = await query;

    if (error) {
      console.error("[Broadcast] Error loading channels:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Creator ID'lerini topla
    const creatorIds = new Set<string>();
    channels?.forEach((ch) => {
      if (ch.creator_id) creatorIds.add(ch.creator_id);
    });

    // Creator profillerini getir
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, is_verified")
      .in("user_id", Array.from(creatorIds))
      .eq("type", "real");

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Response hazırla
    const hasMore = (channels?.length || 0) > limit;
    const resultChannels = hasMore ? channels?.slice(0, limit) : channels;

    const enrichedChannels = resultChannels?.map((ch) => ({
      ...ch,
      creator_profile: ch.creator_id ? profileMap.get(ch.creator_id) : null,
    }));

    const nextCursor = hasMore && resultChannels?.length
      ? resultChannels[resultChannels.length - 1]?.created_at
      : null;

    return NextResponse.json({
      success: true,
      data: enrichedChannels,
      nextCursor,
    });
  } catch (error) {
    console.error("[Broadcast] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
