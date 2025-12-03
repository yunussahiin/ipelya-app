import { ShieldCheck, CheckCircle, XCircle, AlertCircle, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ─────────────────────────────────────────────────────────
// Types - Mobile'dan gelen verification_result formatı
// ─────────────────────────────────────────────────────────

type VerificationStatusType = "passed" | "failed" | "skipped" | "pending";

interface VerificationStatus {
  status: VerificationStatusType | string;
  message?: string;
  score?: number;
}

interface MobileVerificationResult {
  ocr?: VerificationStatus;
  faceMatch?: VerificationStatus;
  liveness?: VerificationStatus;
  // Eski format için fallback
  nameMatch?: boolean;
  birthdateMatch?: boolean;
  livenessPass?: boolean;
  faceMatchScore?: number;
}

interface VerificationResultsCardProps {
  verificationResult: MobileVerificationResult | Record<string, any> | null;
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
  message,
  score
}: {
  label: string;
  status?: VerificationStatusType | string;
  message?: string;
  score?: number;
}) {
  const getStatusIcon = () => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
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
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {score !== undefined && (
          <span
            className={`text-sm font-medium ${
              score >= 0.8 ? "text-green-600" : score >= 0.5 ? "text-yellow-600" : "text-red-600"
            }`}
          >
            {Math.round(score * 100)}%
          </span>
        )}
        {getStatusBadge()}
      </div>
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
  // Parse verification result - hem yeni hem eski format destekle
  const parseVerificationResult = (result: MobileVerificationResult | null) => {
    if (!result) {
      return {
        ocr: { status: "skipped" as const, message: "Henüz yapılmadı" },
        faceMatch: { status: "skipped" as const, message: "Henüz yapılmadı" },
        liveness: { status: "skipped" as const, message: "Henüz yapılmadı" }
      };
    }

    // Yeni format (mobile'dan gelen)
    if (result.ocr || result.faceMatch || result.liveness) {
      return {
        ocr: result.ocr || { status: "skipped" as const },
        faceMatch: result.faceMatch || { status: "skipped" as const },
        liveness: result.liveness || { status: "skipped" as const }
      };
    }

    // Eski format (fallback)
    return {
      ocr: {
        status: result.nameMatch ? ("passed" as const) : ("failed" as const),
        message: result.nameMatch ? "İsim eşleşti" : "İsim eşleşmedi"
      },
      faceMatch: {
        status:
          result.faceMatchScore && result.faceMatchScore >= 0.7
            ? ("passed" as const)
            : ("failed" as const),
        score: result.faceMatchScore
      },
      liveness: {
        status: result.livenessPass ? ("passed" as const) : ("failed" as const)
      }
    };
  };

  const parsed = parseVerificationResult(verificationResult);

  // OCR Form Match ve Face Detection'ı da hesaba kat
  const getOCRStatus = (): VerificationStatus => {
    if (ocrFormMatch === true) {
      return { status: "passed", message: "Form verileri OCR ile eşleşti" };
    }
    if (ocrFormMatch === false) {
      return { status: "failed", message: "Form verileri OCR ile eşleşmedi" };
    }
    return parsed.ocr;
  };

  const getFaceStatus = (): VerificationStatus => {
    if (faceDetectionPassed === true) {
      return { status: "passed", message: "Yüz algılama başarılı" };
    }
    if (faceDetectionPassed === false) {
      return { status: "failed", message: "Yüz algılama başarısız" };
    }
    return parsed.faceMatch;
  };

  const hasAnyData = verificationResult || ocrFormMatch !== null || faceDetectionPassed !== null;

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
            <VerificationResultItem
              label="OCR / İsim Eşleşmesi"
              status={getOCRStatus().status}
              message={getOCRStatus().message}
            />
            <VerificationResultItem
              label="Yüz Algılama"
              status={getFaceStatus().status}
              message={getFaceStatus().message}
              score={parsed.faceMatch.score}
            />
            <VerificationResultItem
              label="Canlılık Kontrolü"
              status={parsed.liveness.status}
              message={parsed.liveness.message}
            />

            <Separator />

            {/* Genel Skor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Genel Skor</span>
                <span
                  className={`font-bold ${
                    (autoScore || 0) >= 0.8
                      ? "text-green-600"
                      : (autoScore || 0) >= 0.5
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {Math.round((autoScore || 0) * 100)}%
                </span>
              </div>
              <Progress value={(autoScore || 0) * 100} />
            </div>

            {/* Öneri */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Öneri</span>
              <Badge
                variant={
                  autoRecommendation === "auto_approve"
                    ? "default"
                    : autoRecommendation === "auto_reject"
                      ? "destructive"
                      : "secondary"
                }
              >
                {autoRecommendation === "auto_approve"
                  ? "Otomatik Onay"
                  : autoRecommendation === "auto_reject"
                    ? "Otomatik Red"
                    : "Manuel İnceleme"}
              </Badge>
            </div>
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
