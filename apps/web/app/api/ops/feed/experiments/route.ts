/**
 * Experiments API Route
 *
 * GET: List all experiments
 * POST: Create new experiment
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    // Get experiments from algorithm_configs
    const { data: experiments, error } = await supabase
      .from("algorithm_configs")
      .select("*")
      .eq("config_type", "experiment")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Experiments fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to experiment format
    const transformedExperiments = experiments?.map((exp) => ({
      id: exp.id,
      name: exp.config_value?.name || "Unnamed",
      description: exp.config_value?.description || "",
      config_type: exp.config_value?.config_type || "weights",
      variant_a: exp.config_value?.variant_a || {},
      variant_b: exp.config_value?.variant_b || {},
      allocation: exp.config_value?.allocation || 50,
      status: exp.config_value?.status || "draft",
      start_date: exp.config_value?.start_date || null,
      end_date: exp.config_value?.end_date || null,
      results: exp.config_value?.results || null,
      created_at: exp.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        experiments: transformedExperiments || []
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
    const { name, description, config_type, allocation, duration_days } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get current config as variant A
    const { data: currentConfig } = await supabase
      .from("algorithm_configs")
      .select("config_value")
      .eq("config_type", config_type)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Create experiment
    const experimentConfig = {
      name,
      description,
      config_type,
      variant_a: currentConfig?.config_value || {},
      variant_b: currentConfig?.config_value || {}, // Start with same, admin will modify
      allocation,
      duration_days,
      status: "draft",
      start_date: null,
      end_date: null,
      results: null
    };

    const { data: newExperiment, error: insertError } = await supabase
      .from("algorithm_configs")
      .insert({
        config_type: "experiment",
        config_value: experimentConfig,
        is_active: false,
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
        id: newExperiment.id,
        ...experimentConfig
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
