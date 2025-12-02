import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  FileText,
  ShieldCheck,
  Eye,
  Maximize2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KYCStatusBadge, OCRComparisonCard } from "@/components/ops/finance";
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

  // Auth user (email için)
  const { data: authData } = await supabase.auth.admin.getUserById(application.creator_id);

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

  return {
    application: { ...application, reviewer },
    creator: profile ? { ...profile, email: authData?.user?.email } : null,
    signedUrls
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function VerificationResultItem({
  label,
  passed,
  score
}: {
  label: string;
  passed?: boolean;
  score?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {passed !== undefined ? (
        passed ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )
      ) : score !== undefined ? (
        <span
          className={`text-sm font-medium ${
            score >= 0.8 ? "text-green-600" : score >= 0.5 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {Math.round(score * 100)}%
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )}
    </div>
  );
}

function DocumentImage({ src, alt, label }: { src?: string; alt: string; label: string }) {
  if (!src) {
    return (
      <div className="border rounded-lg p-8 text-center bg-muted">
        <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label} yüklenmemiş</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="relative border rounded-lg overflow-hidden bg-muted">
        <Image
          src={src}
          alt={alt}
          width={400}
          height={250}
          className="w-full h-auto object-contain"
        />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

async function KYCDetailContent({ applicationId }: { applicationId: string }) {
  const data = await getKYCApplicationDetail(applicationId);

  if (!data) {
    notFound();
  }

  const { application, creator, signedUrls } = data;
  const isPending = application.status === "pending";
  const verificationResult = application.verification_result as Record<string, any> | null;
  const ocrData = application.ocr_data as Record<string, any> | null;

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Otomatik Doğrulama Sonuçları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationResult ? (
                <>
                  <VerificationResultItem
                    label="İsim Eşleşmesi (OCR)"
                    passed={verificationResult.nameMatch}
                  />
                  <VerificationResultItem
                    label="Doğum Tarihi Eşleşmesi"
                    passed={verificationResult.birthdateMatch}
                  />
                  <VerificationResultItem
                    label="Yüz Eşleşmesi"
                    passed={verificationResult.faceMatch}
                    score={verificationResult.faceMatchScore}
                  />
                  <VerificationResultItem
                    label="Canlılık Kontrolü"
                    passed={verificationResult.livenessPass}
                  />

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Genel Skor</span>
                      <span
                        className={`font-bold ${
                          application.auto_score >= 0.8
                            ? "text-green-600"
                            : application.auto_score >= 0.5
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {Math.round((application.auto_score || 0) * 100)}%
                      </span>
                    </div>
                    <Progress value={(application.auto_score || 0) * 100} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Öneri</span>
                    <Badge
                      variant={
                        application.auto_recommendation === "auto_approve"
                          ? "default"
                          : application.auto_recommendation === "auto_reject"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {application.auto_recommendation === "auto_approve"
                        ? "Otomatik Onay"
                        : application.auto_recommendation === "auto_reject"
                          ? "Otomatik Red"
                          : "Manuel İnceleme"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Otomatik doğrulama yapılmamış</p>
                </div>
              )}
            </CardContent>
          </Card>

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Belgeler
              </CardTitle>
              <CardDescription>Kimlik ve selfie görüntüleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kimlik ve Selfie yan yana */}
              <div className="grid gap-4 md:grid-cols-2">
                <DocumentImage src={signedUrls.idFront} alt="Kimlik Ön Yüz" label="Kimlik Ön Yüz" />
                <DocumentImage src={signedUrls.selfie} alt="Selfie" label="Selfie" />
              </div>

              {/* Kimlik Arka */}
              <DocumentImage
                src={signedUrls.idBack}
                alt="Kimlik Arka Yüz"
                label="Kimlik Arka Yüz"
              />

              {/* Yüz Karşılaştırma */}
              {verificationResult?.faceMatchScore && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">Yüz Karşılaştırma Skoru</p>
                  <div className="flex items-center gap-3">
                    <Progress value={verificationResult.faceMatchScore * 100} className="flex-1" />
                    <span
                      className={`font-bold ${
                        verificationResult.faceMatchScore >= 0.8
                          ? "text-green-600"
                          : verificationResult.faceMatchScore >= 0.5
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {Math.round(verificationResult.faceMatchScore * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
