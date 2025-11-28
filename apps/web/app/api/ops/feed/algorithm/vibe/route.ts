/**
 * Vibe Matrix API Route
 *
 * GET: Mevcut vibe matrix konfigürasyonunu getir
 * PUT: Vibe matrix konfigürasyonunu güncelle
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const CONFIG_TYPE = "vibe_matrix";

// Default matrix values
const DEFAULT_MATRIX: Record<string, Record<string, number>> = {
  energetic: { post: 80, mini_post: 90, poll: 70, voice_moment: 85, comment: 75 },
  chill: { post: 70, mini_post: 60, poll: 50, voice_moment: 80, comment: 55 },
  social: { post: 75, mini_post: 85, poll: 90, voice_moment: 70, comment: 95 },
  creative: { post: 90, mini_post: 75, poll: 60, voice_moment: 85, comment: 65 },
  adventurous: { post: 85, mini_post: 80, poll: 75, voice_moment: 90, comment: 70 }
};

export async function GET() {
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

    // Get current config
    const { data: config, error } = await supabase
      .from("algorithm_configs")
      .select("*")
      .eq("config_type", CONFIG_TYPE)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Config fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        config: config?.config_value || DEFAULT_MATRIX,
        updated_at: config?.updated_at || null,
        updated_by: config?.updated_by || null
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

export async function PUT(request: NextRequest) {
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
    const { config } = body;

    if (!config || typeof config !== "object") {
      return NextResponse.json({ error: "Invalid config format" }, { status: 400 });
    }

    // Validate matrix structure
    const vibeTypes = ["energetic", "chill", "social", "creative", "adventurous"];
    const contentTypes = ["post", "mini_post", "poll", "voice_moment", "comment"];

    for (const vibe of vibeTypes) {
      if (!config[vibe]) {
        return NextResponse.json({ error: `Missing vibe type: ${vibe}` }, { status: 400 });
      }
      for (const content of contentTypes) {
        if (typeof config[vibe][content] !== "number") {
          return NextResponse.json(
            { error: `Invalid value for ${vibe}.${content}` },
            { status: 400 }
          );
        }
      }
    }

    // Deactivate old configs
    await supabase
      .from("algorithm_configs")
      .update({ is_active: false })
      .eq("config_type", CONFIG_TYPE);

    // Insert new config
    const { data: newConfig, error: insertError } = await supabase
      .from("algorithm_configs")
      .insert({
        config_type: CONFIG_TYPE,
        config_value: config,
        is_active: true,
        updated_by: session.user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        config: newConfig.config_value,
        updated_at: newConfig.updated_at,
        updated_by: newConfig.updated_by
      }
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
