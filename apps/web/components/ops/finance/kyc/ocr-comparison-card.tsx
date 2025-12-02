"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { CheckCircle, XCircle, AlertCircle, ScanLine, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface OCRData {
  tc_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  confidence_score?: number;
  field_scores?: {
    tc_number?: number;
    first_name?: number;
    last_name?: number;
    birth_date?: number;
  };
}

interface FormData {
  id_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
}

interface OCRComparisonCardProps {
  ocrData: OCRData | null;
  formData: FormData;
  ocrFormMatch?: boolean | null;
  faceDetectionPassed?: boolean | null;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function normalizeString(str: string | null | undefined): string {
  if (!str) return "";
  return str.toUpperCase().trim().replace(/\s+/g, " ");
}

function compareFields(
  ocrValue: string | null | undefined,
  formValue: string | null | undefined
): boolean {
  return normalizeString(ocrValue) === normalizeString(formValue);
}

function getConfidenceColor(score: number): string {
  if (score >= 0.9) return "text-green-600";
  if (score >= 0.7) return "text-yellow-600";
  return "text-red-600";
}

function getConfidenceLabel(score: number): string {
  if (score >= 0.9) return "Yüksek";
  if (score >= 0.7) return "Orta";
  return "Düşük";
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function ConfidenceBar({ score, label }: { score: number; label?: string }) {
  const percentage = Math.round(score * 100);

  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-2">
        <Progress
          value={percentage}
          className={cn(
            "h-2 flex-1",
            score >= 0.9 && "[&>div]:bg-green-500",
            score >= 0.7 && score < 0.9 && "[&>div]:bg-yellow-500",
            score < 0.7 && "[&>div]:bg-red-500"
          )}
        />
        <span className={cn("text-xs font-medium w-10", getConfidenceColor(score))}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function MatchBadge({ match }: { match: boolean }) {
  return match ? (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
    >
      <CheckCircle className="h-3 w-3 mr-1" />
      Eşleşiyor
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
    >
      <XCircle className="h-3 w-3 mr-1" />
      Eşleşmiyor
    </Badge>
  );
}

function ComparisonRow({
  label,
  formValue,
  ocrValue,
  fieldScore,
  highlight
}: {
  label: string;
  formValue: string | null | undefined;
  ocrValue: string | null | undefined;
  fieldScore?: number;
  highlight: boolean;
}) {
  const match = compareFields(ocrValue, formValue);

  return (
    <TableRow className={cn(!match && highlight && "bg-red-50 dark:bg-red-950/30")}>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell>{formValue || "-"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{ocrValue || "-"}</span>
          {fieldScore !== undefined && (
            <span className={cn("text-xs", getConfidenceColor(fieldScore))}>
              ({Math.round(fieldScore * 100)}%)
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {ocrValue ? <MatchBadge match={match} /> : <span className="text-muted-foreground">-</span>}
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function OCRComparisonCard({
  ocrData,
  formData,
  ocrFormMatch,
  faceDetectionPassed
}: OCRComparisonCardProps) {
  // OCR verisi yoksa bilgi mesajı göster
  if (!ocrData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            OCR Karşılaştırma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">OCR verisi bulunamadı</p>
            <p className="text-sm mt-1">Kimlik taraması henüz yapılmamış veya başarısız olmuş.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallConfidence = ocrData.confidence_score ?? 0;
  const fieldScores = ocrData.field_scores || {};

  // TC kimlik numarasını maskele (son 4 hane göster)
  const maskedTcForm = formData.id_number ? `***${formData.id_number.slice(-4)}` : null;
  const maskedTcOcr = ocrData.tc_number ? `***${ocrData.tc_number.slice(-4)}` : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            OCR Karşılaştırma
          </CardTitle>
          {ocrFormMatch !== null && ocrFormMatch !== undefined && (
            <Badge variant={ocrFormMatch ? "default" : "destructive"} className="text-xs">
              {ocrFormMatch ? "Tüm Alanlar Eşleşiyor" : "Uyuşmazlık Var"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Genel Güven Skoru */}
        <div className="p-3 rounded-lg bg-muted">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Genel OCR Güven Skoru</span>
            <span className={cn("font-bold", getConfidenceColor(overallConfidence))}>
              {getConfidenceLabel(overallConfidence)}
            </span>
          </div>
          <ConfidenceBar score={overallConfidence} />
        </div>

        {/* Yüz Algılama Durumu */}
        {faceDetectionPassed !== null && faceDetectionPassed !== undefined && (
          <div
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              faceDetectionPassed
                ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            )}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Selfie Yüz Algılama</span>
            </div>
            {faceDetectionPassed ? (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Yüz Algılandı
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Yüz Algılanamadı
              </Badge>
            )}
          </div>
        )}

        {/* Karşılaştırma Tablosu */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Alan</TableHead>
              <TableHead>Form Bilgisi</TableHead>
              <TableHead>OCR Sonucu</TableHead>
              <TableHead className="w-[120px]">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ComparisonRow
              label="TC Kimlik No"
              formValue={maskedTcForm}
              ocrValue={maskedTcOcr}
              fieldScore={fieldScores.tc_number}
              highlight={true}
            />
            <ComparisonRow
              label="Ad"
              formValue={formData.first_name}
              ocrValue={ocrData.first_name}
              fieldScore={fieldScores.first_name}
              highlight={true}
            />
            <ComparisonRow
              label="Soyad"
              formValue={formData.last_name}
              ocrValue={ocrData.last_name}
              fieldScore={fieldScores.last_name}
              highlight={true}
            />
            <ComparisonRow
              label="Doğum Tarihi"
              formValue={
                formData.birth_date
                  ? new Date(formData.birth_date).toLocaleDateString("tr-TR")
                  : null
              }
              ocrValue={
                ocrData.birth_date ? new Date(ocrData.birth_date).toLocaleDateString("tr-TR") : null
              }
              fieldScore={fieldScores.birth_date}
              highlight={true}
            />
          </TableBody>
        </Table>

        {/* Alan Bazlı Güven Skorları */}
        {Object.keys(fieldScores).length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-3">Alan Bazlı OCR Güven Skorları</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {fieldScores.tc_number !== undefined && (
                <ConfidenceBar score={fieldScores.tc_number} label="TC Kimlik No" />
              )}
              {fieldScores.first_name !== undefined && (
                <ConfidenceBar score={fieldScores.first_name} label="Ad" />
              )}
              {fieldScores.last_name !== undefined && (
                <ConfidenceBar score={fieldScores.last_name} label="Soyad" />
              )}
              {fieldScores.birth_date !== undefined && (
                <ConfidenceBar score={fieldScores.birth_date} label="Doğum Tarihi" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
