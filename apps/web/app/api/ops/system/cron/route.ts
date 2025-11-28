import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

interface CronJobRun {
  jobid: number;
  runid: number;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
  command: string;
}

// GET: Get cron jobs and their run history
export async function GET(request: NextRequest) {
  console.log("[Cron API] Request received");

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
    const jobId = searchParams.get("jobId");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get cron jobs
    const { data: jobs, error: jobsError } = await supabase.rpc("get_cron_jobs");

    if (jobsError) {
      console.error("[Cron API] Jobs error:", jobsError);
      // Fallback: direct query
      const { data: directJobs } = await supabase
        .from("cron.job" as never)
        .select("*");
      
      if (!directJobs) {
        return NextResponse.json({ jobs: [], runs: [], stats: null });
      }
    }

    // Get run history
    const { data: runs, error: runsError } = await supabase.rpc("get_cron_job_runs", { 
      p_limit: limit,
      p_job_id: jobId ? parseInt(jobId) : null
    });

    if (runsError) {
      console.error("[Cron API] Runs error:", runsError);
    }

    // Calculate stats per job
    const jobStats: Record<number, { 
      total: number; 
      succeeded: number; 
      failed: number; 
      avgDuration: number;
      lastRun: string | null;
      lastStatus: string | null;
    }> = {};

    (runs || []).forEach((run: CronJobRun) => {
      if (!jobStats[run.jobid]) {
        jobStats[run.jobid] = { 
          total: 0, 
          succeeded: 0, 
          failed: 0, 
          avgDuration: 0,
          lastRun: null,
          lastStatus: null
        };
      }
      
      const stat = jobStats[run.jobid];
      stat.total++;
      
      if (run.status === "succeeded") {
        stat.succeeded++;
      } else {
        stat.failed++;
      }

      // Calculate duration
      const startTime = new Date(run.start_time).getTime();
      const endTime = new Date(run.end_time).getTime();
      const duration = endTime - startTime;
      stat.avgDuration = (stat.avgDuration * (stat.total - 1) + duration) / stat.total;

      // Track last run
      if (!stat.lastRun || new Date(run.start_time) > new Date(stat.lastRun)) {
        stat.lastRun = run.start_time;
        stat.lastStatus = run.status;
      }
    });

    console.log("[Cron API] Success - jobs:", (jobs || []).length, "runs:", (runs || []).length);

    return NextResponse.json({
      jobs: jobs || [],
      runs: runs || [],
      stats: jobStats
    });
  } catch (error) {
    console.error("[Cron API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
