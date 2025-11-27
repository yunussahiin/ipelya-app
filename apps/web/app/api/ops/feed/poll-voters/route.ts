/**
 * Ops Poll Voters API Route
 * get-poll-voters edge function'ını çağırır
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get("poll_id");
    const optionId = searchParams.get("option_id");

    if (!pollId) {
      return NextResponse.json({ success: false, error: "poll_id required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let edgeFunctionUrl = `${supabaseUrl}/functions/v1/get-poll-voters?poll_id=${pollId}`;
    
    if (optionId) {
      edgeFunctionUrl += `&option_id=${optionId}`;
    }

    const response = await fetch(edgeFunctionUrl, {
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
    console.error("Poll voters API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
