import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck, Clock, Check, X, User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KYCStatusBadge } from "@/components/ops/finance";

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getKYCApplications() {
  const supabase = await createServerSupabaseClient();

  const { data: applications, error } = await supabase
    .from("kyc_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[KYC] Error:", error);
    return { applications: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0 } };
  }

  // Creator profilleri
  const creatorIds = [...new Set(applications?.map((a) => a.creator_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", creatorIds)
    .eq("type", "real");

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  const enrichedApplications = applications?.map((app) => ({
    ...app,
    creator: profileMap.get(app.creator_id) || null
  }));

  const counts = {
    all: applications?.length || 0,
    pending: applications?.filter((a) => a.status === "pending").length || 0,
    approved: applications?.filter((a) => a.status === "approved").length || 0,
    rejected: applications?.filter((a) => a.status === "rejected").length || 0
  };

  return { applications: enrichedApplications || [], counts };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function RecommendationBadge({ recommendation }: { recommendation?: string }) {
  if (!recommendation) return null;

  const config: Record<string, { label: string; className: string }> = {
    auto_approve: {
      label: "Otomatik Onay",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    },
    manual_review: {
      label: "Manuel İnceleme",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    },
    auto_reject: {
      label: "Otomatik Red",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  };

  const c = config[recommendation] || { label: recommendation, className: "" };

  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

function KYCApplicationsTable({ applications }: { applications: any[] }) {
  if (applications.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Bu kategoride başvuru yok</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Creator</TableHead>
          <TableHead>Ad Soyad</TableHead>
          <TableHead className="text-center">Skor</TableHead>
          <TableHead>Öneri</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Durum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app) => (
          <TableRow key={app.id}>
            <TableCell>
              <Link
                href={`/ops/kyc/${app.id}`}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={app.creator?.avatar_url || undefined} />
                  <AvatarFallback>
                    {app.creator?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">@{app.creator?.username || "unknown"}</span>
              </Link>
            </TableCell>
            <TableCell>
              {app.first_name} {app.last_name}
            </TableCell>
            <TableCell className="text-center">
              {app.auto_score ? (
                <span
                  className={`font-medium ${
                    app.auto_score >= 0.8
                      ? "text-green-600"
                      : app.auto_score >= 0.5
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {Math.round(app.auto_score * 100)}%
                </span>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <RecommendationBadge recommendation={app.auto_recommendation} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(app.created_at).toLocaleDateString("tr-TR")}
            </TableCell>
            <TableCell>
              <KYCStatusBadge status={app.status} level={app.level} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function KYCApplicationsContent() {
  const { applications, counts } = await getKYCApplications();

  const pending = applications.filter((a) => a.status === "pending");
  const approved = applications.filter((a) => a.status === "approved");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          KYC Başvuruları
        </CardTitle>
        <CardDescription>Kimlik doğrulama başvuru listesi</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              Tümü
              <Badge variant="secondary">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-3 w-3" />
              Bekleyen
              {counts.pending > 0 && <Badge variant="destructive">{counts.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check className="h-3 w-3" />
              Onaylı
              <Badge variant="secondary">{counts.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <X className="h-3 w-3" />
              Reddedilmiş
              <Badge variant="secondary">{counts.rejected}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <KYCApplicationsTable applications={applications} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <KYCApplicationsTable applications={pending} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <KYCApplicationsTable applications={approved} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <KYCApplicationsTable applications={rejected} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function KYCApplicationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-80 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function KYCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KYC Yönetimi</h1>
        <p className="text-muted-foreground">Kimlik doğrulama başvuru onayları</p>
      </div>

      <Suspense fallback={<KYCApplicationsSkeleton />}>
        <KYCApplicationsContent />
      </Suspense>
    </div>
  );
}
