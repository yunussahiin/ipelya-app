"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Play,
  Pause,
  Timer,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
  database: string;
}

interface CronJobRun {
  jobid: number;
  runid: number;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
  command: string;
}

interface JobStats {
  total: number;
  succeeded: number;
  failed: number;
  avgDuration: number;
  lastRun: string | null;
  lastStatus: string | null;
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runs, setRuns] = useState<CronJobRun[]>([]);
  const [stats, setStats] = useState<Record<number, JobStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string>("all");

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const jobId = selectedJob !== "all" ? `&jobId=${selectedJob}` : "";
      const response = await fetch(`/api/ops/system/cron?limit=200${jobId}`);

      if (!response.ok) throw new Error("Failed to fetch cron data");

      const data = await response.json();
      setJobs(data.jobs || []);
      setRuns(data.runs || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching cron data:", error);
      toast.error("Cron verileri yüklenirken hata oluştu");
    }
  }, [selectedJob]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, [fetchData]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Yenilendi");
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format schedule (cron expression)
  const formatSchedule = (schedule: string) => {
    if (schedule === "* * * * *") return "Her dakika";
    if (schedule === "*/1 * * * *") return "Her dakika";
    if (schedule === "*/5 * * * *") return "Her 5 dakika";
    if (schedule === "*/15 * * * *") return "Her 15 dakika";
    if (schedule === "0 * * * *") return "Her saat";
    if (schedule === "0 0 * * *") return "Her gün gece yarısı";
    return schedule;
  };

  // Calculate totals
  const totalRuns = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalSucceeded = Object.values(stats).reduce((sum, s) => sum + s.succeeded, 0);
  const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);
  const successRate = totalRuns > 0 ? ((totalSucceeded / totalRuns) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
          <p className="text-sm text-muted-foreground">Zamanlanmış görevler ve çalışma geçmişi</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Job seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.jobid} value={String(job.jobid)}>
                  {job.jobname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter((j) => j.active).length}</div>
            <p className="text-xs text-muted-foreground">{jobs.length} toplam job</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Çalışma
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground">Son 24 saat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Başarı Oranı
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalSucceeded} başarılı / {totalFailed} hatalı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hatalı Çalışma
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalFailed > 0 ? "text-red-600" : ""}`}>
              {totalFailed}
            </div>
            <p className="text-xs text-muted-foreground">Son 24 saat</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cron Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Zamanlama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Çalışma</TableHead>
                <TableHead className="text-right">Başarı</TableHead>
                <TableHead className="text-right">Ort. Süre</TableHead>
                <TableHead>Son Çalışma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const jobStat = stats[job.jobid];
                return (
                  <TableRow key={job.jobid}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{job.jobname}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {job.command.substring(0, 50)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {formatSchedule(job.schedule)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.active ? (
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          <Play className="h-3 w-3 mr-1" /> Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Pause className="h-3 w-3 mr-1" /> Pasif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{jobStat?.total || 0}</TableCell>
                    <TableCell className="text-right">
                      {jobStat ? (
                        <span className={jobStat.failed > 0 ? "text-red-600" : "text-green-600"}>
                          {jobStat.succeeded}/{jobStat.total}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {jobStat?.avgDuration ? formatDuration(jobStat.avgDuration) : "-"}
                    </TableCell>
                    <TableCell>
                      {jobStat?.lastRun ? (
                        <div className="flex items-center gap-2">
                          {jobStat.lastStatus === "succeeded" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {new Date(jobStat.lastRun).toLocaleString("tr-TR")}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle>Çalışma Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zaman</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Mesaj</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const job = jobs.find((j) => j.jobid === run.jobid);
                  const duration =
                    new Date(run.end_time).getTime() - new Date(run.start_time).getTime();

                  return (
                    <TableRow key={run.runid}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(run.start_time).toLocaleDateString("tr-TR")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(run.start_time).toLocaleTimeString("tr-TR")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {job?.jobname || `Job #${run.jobid}`}
                      </TableCell>
                      <TableCell>
                        {run.status === "succeeded" ? (
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Başarılı
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Hata
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(duration)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {run.return_message}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
