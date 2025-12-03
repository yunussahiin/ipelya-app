import { ShieldCheck, CheckCircle, XCircle, AlertCircle, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ─────────────────────────────────────────────────────────
// Types - Edge function'dan gelen verification_result formatı
// ─────────────────────────────────────────────────────────

type VerificationStatusType = "passed" | "failed" | "skipped" | "partial" | "pending";

interface OCRMatches {
  firstName: boolean;
  lastName: boolean;
  tcNumber: boolean;
  birthDate?: boolean;
}

interface VerificationCategory {
  status: VerificationStatusType | string;
  message?: string;
  score?: number;
  maxScore?: number;
  matches?: OCRMatches;
  completedSteps?: string[];
  rawConfidence?: number;
}

interface EdgeFunctionVerificationResult {
  ocr?: VerificationCategory;
  faceDetection?: VerificationCategory;
  liveness?: VerificationCategory;
  ocrConfidence?: VerificationCategory;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  thresholds?: {
    autoApprove: number;
    manualReview: number;
    autoReject: number;
  };
  isFirstApplication?: boolean;
  autoActionTaken?: string | null;
}

interface VerificationResultsCardProps {
  verificationResult: EdgeFunctionVerificationResult | Record<string, unknown> | null;
  autoScore: number | null;
  autoRecommendation: string | null;
  ocrFormMatch: boolean | null;
  faceDetectionPassed: boolean | null;
}

// ─────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────

function VerificationResultItem({
  label,
  status,
  score,
  maxScore,
  subItems
}: {
  label: string;
  status?: VerificationStatusType | string;
  score?: number;
  maxScore?: number;
  subItems?: { label: string; passed: boolean }[];
}) {
  const getStatusIcon = () => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "skipped":
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "passed":
        return (
          <Badge variant="default" className="bg-green-500">
            Geçti
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Kısmi
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Başarısız</Badge>;
      case "skipped":
        return <Badge variant="secondary">Atlandı</Badge>;
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Bekliyor
          </Badge>
        );
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {score !== undefined && maxScore !== undefined && (
            <span className="text-xs text-muted-foreground">
              {score}/{maxScore}p
            </span>
          )}
          {getStatusBadge()}
        </div>
      </div>
      {subItems && subItems.length > 0 && (
        <div className="ml-6 grid grid-cols-2 gap-1 text-xs">
          {subItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              {item.passed ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className={item.passed ? "text-green-600" : "text-red-600"}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function VerificationResultsCard({
  verificationResult,
  autoScore,
  autoRecommendation,
  ocrFormMatch,
  faceDetectionPassed
}: VerificationResultsCardProps) {
  // Edge function'dan gelen yeni format
  const result = verificationResult as EdgeFunctionVerificationResult | null;

  // OCR matches'ı sub-items'a çevir
  const getOCRSubItems = () => {
    const matches = result?.ocr?.matches;
    if (!matches) return undefined;

    return [
      { label: "Ad", passed: matches.firstName },
      { label: "Soyad", passed: matches.lastName },
      { label: "TC No", passed: matches.tcNumber },
      ...(matches.birthDate !== undefined
        ? [{ label: "Doğum Tarihi", passed: matches.birthDate }]
        : [])
    ];
  };

  // Liveness steps'i sub-items'a çevir
  const getLivenessSubItems = () => {
    const steps = result?.liveness?.completedSteps;
    if (!steps || steps.length === 0) return undefined;

    const allSteps = ["blink", "smile", "turn_right", "turn_left"];
    const stepLabels: Record<string, string> = {
      blink: "Göz Kırp",
      smile: "Gülümse",
      turn_right: "Sağa Dön",
      turn_left: "Sola Dön"
    };

    return allSteps.map((step) => ({
      label: stepLabels[step] || step,
      passed: steps.includes(step)
    }));
  };

  const hasAnyData = verificationResult || ocrFormMatch !== null || faceDetectionPassed !== null;

  // Fallback status hesaplama
  const getOCRStatus = () => {
    if (result?.ocr) return result.ocr.status;
    if (ocrFormMatch === true) return "passed";
    if (ocrFormMatch === false) return "failed";
    return "skipped";
  };

  const getFaceStatus = () => {
    if (result?.faceDetection) return result.faceDetection.status;
    if (faceDetectionPassed === true) return "passed";
    if (faceDetectionPassed === false) return "failed";
    return "skipped";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Otomatik Doğrulama Sonuçları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAnyData ? (
          <>
            {/* OCR / Veri Eşleşmesi */}
            <VerificationResultItem
              label="OCR / Veri Eşleşmesi"
              status={getOCRStatus()}
              score={result?.ocr?.score}
              maxScore={result?.ocr?.maxScore}
              subItems={getOCRSubItems()}
            />

            {/* Yüz Algılama */}
            <VerificationResultItem
              label="Yüz Algılama"
              status={getFaceStatus()}
              score={result?.faceDetection?.score}
              maxScore={result?.faceDetection?.maxScore}
            />

            {/* Canlılık Kontrolü */}
            <VerificationResultItem
              label="Canlılık Kontrolü"
              status={result?.liveness?.status || "skipped"}
              score={result?.liveness?.score}
              maxScore={result?.liveness?.maxScore}
              subItems={getLivenessSubItems()}
            />

            {/* OCR Güven Skoru */}
            <VerificationResultItem
              label="OCR Güven Skoru"
              status={result?.ocrConfidence?.status || "skipped"}
              score={result?.ocrConfidence?.score}
              maxScore={result?.ocrConfidence?.maxScore}
            />

            <Separator />

            {/* Genel Skor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Genel Skor</span>
                <span
                  className={`font-bold ${
                    (autoScore || 0) >= 0.85
                      ? "text-green-600"
                      : (autoScore || 0) >= 0.6
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {result?.totalScore !== undefined && result?.maxScore !== undefined
                    ? `${result.totalScore}/${result.maxScore}p (${result.percentage}%)`
                    : `${Math.round((autoScore || 0) * 100)}%`}
                </span>
              </div>
              <Progress value={(autoScore || 0) * 100} />

              {/* Eşikler */}
              {result?.thresholds && (
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Red: &lt;{result.thresholds.autoReject}%</span>
                  <span>Manuel: {result.thresholds.manualReview}%+</span>
                  <span>Onay: {result.thresholds.autoApprove}%+</span>
                </div>
              )}
            </div>

            {/* Öneri */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Öneri</span>
              <div className="flex items-center gap-2">
                {result?.isFirstApplication && (
                  <Badge variant="outline" className="text-xs">
                    İlk Başvuru
                  </Badge>
                )}
                <Badge
                  variant={
                    autoRecommendation === "auto_approve"
                      ? "default"
                      : autoRecommendation === "likely_reject"
                        ? "destructive"
                        : "secondary"
                  }
                  className={autoRecommendation === "auto_approve" ? "bg-green-500" : ""}
                >
                  {autoRecommendation === "auto_approve"
                    ? "Otomatik Onay"
                    : autoRecommendation === "likely_reject"
                      ? "Muhtemel Red"
                      : "Manuel İnceleme"}
                </Badge>
              </div>
            </div>

            {/* Otomatik İşlem Bilgisi */}
            {result?.autoActionTaken && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="font-medium">
                  {result.autoActionTaken === "auto_approved"
                    ? "✅ Bu başvuru otomatik olarak onaylandı"
                    : "❌ Bu başvuru otomatik olarak reddedildi"}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Otomatik doğrulama henüz yapılmamış</p>
            <p className="text-xs mt-1">Başvuru inceleme bekliyor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
