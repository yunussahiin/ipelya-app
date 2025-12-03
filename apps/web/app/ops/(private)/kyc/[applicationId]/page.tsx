import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  KYCStatusBadge,
  OCRComparisonCard,
  DocumentsGrid,
  VerificationResultsCard,
  PreviousApplicationsCard
} from "@/components/ops/finance";
import { KYCActionsButtons } from "./actions-buttons";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ applicationId: string }>;
}

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getKYCApplicationDetail(applicationId: string) {
  const supabase = await createServerSupabaseClient();

  // KYC başvurusu
  const { data: application, error } = await supabase
    .from("kyc_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    return null;
  }

  // Creator profili
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", application.creator_id)
    .eq("type", "real")
    .single();

  // Auth user (email için) - Admin API gerektirir
  const adminSupabase = createAdminSupabaseClient();
  const { data: authData } = await adminSupabase.auth.admin.getUserById(application.creator_id);

  // Signed URLs
  const signedUrls: Record<string, string> = {};

  if (application.id_front_path) {
    const { data: frontUrl } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(application.id_front_path, 3600);
    if (frontUrl) signedUrls.idFront = frontUrl.signedUrl;
  }

  if (application.id_back_path) {
    const { data: backUrl } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(application.id_back_path, 3600);
    if (backUrl) signedUrls.idBack = backUrl.signedUrl;
  }

  if (application.selfie_path) {
    const { data: selfieUrl } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(application.selfie_path, 3600);
    if (selfieUrl) signedUrls.selfie = selfieUrl.signedUrl;
  }

  // Reviewer
  let reviewer = null;
  if (application.reviewed_by) {
    const { data: reviewerData } = await supabase
      .from("admin_profiles")
      .select("id, full_name, email")
      .eq("id", application.reviewed_by)
      .single();
    reviewer = reviewerData;
  }

  // Aynı creator'ın tüm başvuruları (önceki başvurular için)
  const { data: allApplications } = await supabase
    .from("kyc_applications")
    .select(
      `
      id,
      level,
      status,
      first_name,
      last_name,
      birth_date,
      id_number,
      created_at,
      reviewed_at,
      rejection_reason,
      auto_score,
      auto_recommendation,
      ocr_form_match,
      face_detection_passed,
      reviewed_by
    `
    )
    .eq("creator_id", application.creator_id)
    .order("created_at", { ascending: false });

  // Reviewer bilgilerini ekle
  const applicationsWithReviewer = await Promise.all(
    (allApplications || []).map(async (app) => {
      if (app.reviewed_by) {
        const { data: reviewerData } = await supabase
          .from("admin_profiles")
          .select("full_name, email")
          .eq("id", app.reviewed_by)
          .single();
        return { ...app, reviewer: reviewerData };
      }
      return { ...app, reviewer: null };
    })
  );

  return {
    application: { ...application, reviewer },
    creator: profile ? { ...profile, email: authData?.user?.email } : null,
    signedUrls,
    allApplications: applicationsWithReviewer
  };
}

// ─────────────────────────────────────────────────────────
// Types for verification result (mobile format)
// ─────────────────────────────────────────────────────────

interface VerificationResult {
  ocr?: { status: string; message?: string };
  faceMatch?: { status: string; message?: string; score?: number };
  liveness?: { status: string; message?: string };
  // Legacy format
  nameMatch?: boolean;
  birthdateMatch?: boolean;
  livenessPass?: boolean;
  faceMatchScore?: number;
}

async function KYCDetailContent({ applicationId }: { applicationId: string }) {
  const data = await getKYCApplicationDetail(applicationId);

  if (!data) {
    notFound();
  }

  const { application, creator, signedUrls, allApplications } = data;
  const isPending = application.status === "pending";
  const verificationResult = application.verification_result as VerificationResult | null;
  const ocrData = application.ocr_data as Record<string, any> | null;

  // Face match score'u verification_result'tan çıkar
  const faceMatchScore = verificationResult?.faceMatch?.score ?? verificationResult?.faceMatchScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/kyc">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator?.avatar_url || undefined} />
              <AvatarFallback>{creator?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">@{creator?.username}</h1>
              <p className="text-sm text-muted-foreground">{creator?.email}</p>
            </div>
          </div>
          <KYCStatusBadge status={application.status} level={application.level} />
        </div>

        {isPending && <KYCActionsButtons applicationId={application.id} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sol Panel */}
        <div className="space-y-6">
          {/* Creator Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Creator Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">@{creator?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-posta</span>
                <span>{creator?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Başvuru Tarihi</span>
                <span>{new Date(application.created_at).toLocaleDateString("tr-TR")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Form Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Form Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ad</span>
                <span className="font-medium">{application.first_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Soyad</span>
                <span className="font-medium">{application.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doğum Tarihi</span>
                <span>
                  {application.birth_date
                    ? new Date(application.birth_date).toLocaleDateString("tr-TR")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TC Kimlik No</span>
                <span className="font-mono">
                  {application.id_number ? `***${application.id_number.slice(-4)}` : "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Otomatik Doğrulama Sonuçları */}
          <VerificationResultsCard
            verificationResult={verificationResult}
            autoScore={application.auto_score}
            autoRecommendation={application.auto_recommendation}
            ocrFormMatch={application.ocr_form_match}
            faceDetectionPassed={application.face_detection_passed}
          />

          {/* OCR Karşılaştırma */}
          <OCRComparisonCard
            ocrData={ocrData}
            formData={{
              id_number: application.id_number,
              first_name: application.first_name,
              last_name: application.last_name,
              birth_date: application.birth_date
            }}
            ocrFormMatch={application.ocr_form_match}
            faceDetectionPassed={application.face_detection_passed}
          />

          {/* Red Bilgisi */}
          {application.status === "rejected" && application.rejection_reason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Reddedilme Sebebi</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{application.rejection_reason}</p>
                {application.reviewer && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {application.reviewer.full_name || application.reviewer.email} -{" "}
                    {new Date(application.reviewed_at).toLocaleString("tr-TR")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ Panel - Belgeler */}
        <div className="space-y-6">
          <DocumentsGrid signedUrls={signedUrls} faceMatchScore={faceMatchScore} />

          {/* Önceki Başvurular */}
          {allApplications && allApplications.length > 1 && (
            <PreviousApplicationsCard
              applications={allApplications}
              currentApplicationId={application.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function KYCDetailPage({ params }: PageProps) {
  const { applicationId } = await params;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <KYCDetailContent applicationId={applicationId} />
    </Suspense>
  );
}
