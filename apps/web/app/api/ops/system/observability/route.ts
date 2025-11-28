import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// GET: Get observability data from various Supabase services
export async function GET(request: NextRequest) {
  console.log("[Observability API] Request received");

  try {
    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations
    const supabase = createAdminSupabaseClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get URL params
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service") || "all";

    console.log("[Observability API] Fetching database stats...");
    const dbStats = await getDatabaseStats(supabase);
    console.log("[Observability API] DB Stats:", JSON.stringify(dbStats));
    
    console.log("[Observability API] Fetching table sizes...");
    const tableSizes = await getTableSizes(supabase);
    console.log("[Observability API] Table Sizes count:", tableSizes?.length || 0);
    
    console.log("[Observability API] Fetching index usage...");
    const indexUsage = await getIndexUsage(supabase);
    console.log("[Observability API] Index Usage count:", indexUsage?.length || 0);
    
    console.log("[Observability API] Fetching slow queries...");
    const slowQueries = await getSlowQueries(supabase);
    console.log("[Observability API] Slow Queries count:", slowQueries?.length || 0);

    console.log("[Observability API] Fetching connection stats...");
    const connectionStats = await getConnectionStats(supabase);
    console.log("[Observability API] Connection Stats:", JSON.stringify(connectionStats));

    console.log("[Observability API] Success - All data fetched");

    return NextResponse.json({
      service,
      database: {
        stats: dbStats,
        tableSizes,
        indexUsage,
        slowQueries,
        connectionStats
      }
    });
  } catch (error) {
    console.error("[Observability API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDatabaseStats(supabase: any) {
  try {
    const { data, error } = await supabase.rpc("get_database_stats");
    if (error) {
      console.error("[Observability API] getDatabaseStats error:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("[Observability API] getDatabaseStats exception:", e);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTableSizes(supabase: any) {
  try {
    const { data, error } = await supabase.rpc("get_table_sizes");
    if (error) {
      console.error("[Observability API] getTableSizes error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("[Observability API] getTableSizes exception:", e);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getIndexUsage(supabase: any) {
  try {
    const { data, error } = await supabase.rpc("get_index_usage");
    if (error) {
      console.error("[Observability API] getIndexUsage error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("[Observability API] getIndexUsage exception:", e);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSlowQueries(supabase: any) {
  try {
    const { data, error } = await supabase.rpc("get_slow_queries");
    if (error) {
      console.error("[Observability API] getSlowQueries error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("[Observability API] getSlowQueries exception:", e);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getConnectionStats(supabase: any) {
  try {
    const { data, error } = await supabase.rpc("get_connection_stats");
    if (error) {
      console.error("[Observability API] getConnectionStats error:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("[Observability API] getConnectionStats exception:", e);
    return null;
  }
}
