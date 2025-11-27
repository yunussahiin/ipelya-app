/**
 * Feed Algorithm Weights API
 *
 * Amaç: Scoring weights config'ini yönetir
 *
 * Endpoints:
 * - GET: Mevcut aktif weights config'i getir
 * - POST: Yeni weights config oluştur
 * - PUT: Mevcut weights config'i güncelle
 *
 * Database:
 * - algorithm_configs tablosu (config_type: 'weights')
 */

import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/ops/feed/algorithm/weights
 * Mevcut aktif weights config'i getir
 */
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Admin kontrolü
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Aktif weights config'i getir
    const { data, error } = await supabase
      .from("algorithm_configs")
      .select("*")
      .eq("config_type", "weights")
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    console.error("GET weights error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ops/feed/algorithm/weights
 * Yeni weights config oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();

    // Admin kontrolü
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { weights } = body;

    // Validasyon
    if (!weights || typeof weights !== "object") {
      return NextResponse.json({ error: "Invalid weights data" }, { status: 400 });
    }

    const total = Object.values(weights).reduce((sum: number, val) => sum + (val as number), 0);
    if (Math.abs(total - 1) > 0.01) {
      return NextResponse.json({ error: "Weights must sum to 1.0" }, { status: 400 });
    }

    // Mevcut aktif config'i deaktive et
    await supabase
      .from("algorithm_configs")
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq("config_type", "weights")
      .eq("is_active", true);

    // Yeni config oluştur
    const { data, error } = await supabase
      .from("algorithm_configs")
      .insert({
        config_type: "weights",
        config_data: weights,
        is_active: true,
        activated_at: new Date().toISOString(),
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error("POST weights error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ops/feed/algorithm/weights
 * Mevcut weights config'i güncelle
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();

    // Admin kontrolü
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { configId, weights } = body;

    // Validasyon
    if (!weights || typeof weights !== "object") {
      return NextResponse.json({ error: "Invalid weights data" }, { status: 400 });
    }

    const total = Object.values(weights).reduce((sum: number, val) => sum + (val as number), 0);
    if (Math.abs(total - 1) > 0.01) {
      return NextResponse.json({ error: "Weights must sum to 1.0" }, { status: 400 });
    }

    if (configId) {
      // Mevcut config'i güncelle
      const { data, error } = await supabase
        .from("algorithm_configs")
        .update({
          config_data: weights,
          updated_at: new Date().toISOString()
        })
        .eq("id", configId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, config: data });
    } else {
      // configId yoksa yeni oluştur (POST gibi davran)
      // Mevcut aktif config'i deaktive et
      await supabase
        .from("algorithm_configs")
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq("config_type", "weights")
        .eq("is_active", true);

      // Yeni config oluştur
      const { data, error } = await supabase
        .from("algorithm_configs")
        .insert({
          config_type: "weights",
          config_data: weights,
          is_active: true,
          activated_at: new Date().toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, config: data });
    }
  } catch (error) {
    console.error("PUT weights error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
