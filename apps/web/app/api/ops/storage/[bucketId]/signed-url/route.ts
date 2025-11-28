import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// POST: Generate signed URL for private files
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucketId: string }> }
) {
  try {
    // Server client for auth check
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for operations
    const supabase = createAdminSupabaseClient();
    const { bucketId } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, type")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { path, expiresIn = 3600 } = body as {
      path: string;
      expiresIn?: number;
    };

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from(bucketId)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return NextResponse.json({
      signedUrl: data.signedUrl,
      expiresAt,
      expiresIn
    });
  } catch (error) {
    console.error("Signed URL API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
