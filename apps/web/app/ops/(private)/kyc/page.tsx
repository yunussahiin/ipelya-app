import { Suspense } from "react";
import { ShieldCheck, Clock, Check, X, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  KYCDataTable,
  columns,
  type KYCUserGroup,
  type KYCApplication
} from "@/components/ops/finance/kyc/data-table";

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getKYCApplications() {
  const supabase = await createServerSupabaseClient();

  const { data: applications, error } = await supabase
    .from("kyc_applications")
    .select(
      `
      id,
      creator_id,
      level,
      status,
      first_name,
      last_name,
      birth_date,
      id_number,
      auto_score,
      auto_recommendation,
      ocr_form_match,
      face_detection_passed,
      rejection_reason,
      created_at,
      reviewed_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[KYC] Error:", error);
    return { userGroups: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0, users: 0 } };
  }

  // Creator profilleri
  const creatorIds = [...new Set(applications?.map((a) => a.creator_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", creatorIds)
    .eq("type", "real");

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  // Kullanıcı bazlı grupla
  const userGroupMap = new Map<string, KYCUserGroup>();

  applications?.forEach((app) => {
    const creator = profileMap.get(app.creator_id) || null;
    const enrichedApp: KYCApplication = {
      ...app,
      creator
    };

    if (userGroupMap.has(app.creator_id)) {
      const group = userGroupMap.get(app.creator_id)!;
      group.applications.push(enrichedApp);
      group.totalApplications++;
      if (app.status === "approved") group.hasApproved = true;
      if (app.status === "pending") group.hasPending = true;
      if (app.status === "rejected") group.hasRejected = true;
    } else {
      userGroupMap.set(app.creator_id, {
        creator_id: app.creator_id,
        creator,
        applications: [enrichedApp],
        latestApplication: enrichedApp,
        totalApplications: 1,
        hasApproved: app.status === "approved",
        hasPending: app.status === "pending",
        hasRejected: app.status === "rejected"
      });
    }
  });

  const userGroups = Array.from(userGroupMap.values());

  const counts = {
    all: applications?.length || 0,
    pending: applications?.filter((a) => a.status === "pending").length || 0,
    approved: applications?.filter((a) => a.status === "approved").length || 0,
    rejected: applications?.filter((a) => a.status === "rejected").length || 0,
    users: userGroups.length
  };

  return { userGroups, counts };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function StatsCards({
  counts
}: {
  counts: { all: number; pending: number; approved: number; rejected: number; users: number };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.users}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Toplam Başvuru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.all}</div>
        </CardContent>
      </Card>
      <Card className="border-l-2 border-l-yellow-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            Bekleyen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
        </CardContent>
      </Card>
      <Card className="border-l-2 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Onaylı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
        </CardContent>
      </Card>
      <Card className="border-l-2 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            Reddedilmiş
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function KYCApplicationsContent() {
  const { userGroups, counts } = await getKYCApplications();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards counts={counts} />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            KYC Başvuruları
          </CardTitle>
          <CardDescription>
            Kullanıcıya tıklayarak tüm başvurularını görüntüleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KYCDataTable columns={columns} data={userGroups} />
        </CardContent>
      </Card>
    </div>
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
