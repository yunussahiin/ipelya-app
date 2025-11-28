/**
 * Diversity Settings API Route
 *
 * GET: Mevcut diversity konfigürasyonunu getir
 * PUT: Diversity konfigürasyonunu güncelle
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const CONFIG_TYPE = "diversity";

// Default distribution (per 20 items)
const DEFAULT_DISTRIBUTION: Record<string, number> = {
  post: 8,
  mini_post: 6,
  poll: 4,
  voice_moment: 2
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
      console.error("Config fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        config: config?.config_value || DEFAULT_DISTRIBUTION,
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

    // Validate structure
    const contentTypes = ["post", "mini_post", "poll", "voice_moment"];
    let total = 0;

    for (const content of contentTypes) {
      if (typeof config[content] !== "number" || config[content] < 0) {
        return NextResponse.json(
          { error: `Invalid value for ${content}` },
          { status: 400 }
        );
      }
      total += config[content];
    }

    // Validate total is 20
    if (total !== 20) {
      return NextResponse.json(
        { error: `Total must be 20, got ${total}` },
        { status: 400 }
      );
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
