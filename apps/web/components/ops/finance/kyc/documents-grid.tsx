"use client";

import { Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DocumentImageModal } from "./document-image-modal";

interface DocumentsGridProps {
  signedUrls: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
  };
  faceMatchScore?: number;
}

export function DocumentsGrid({ signedUrls, faceMatchScore }: DocumentsGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Belgeler
        </CardTitle>
        <CardDescription>Kimlik ve selfie görüntüleri - Büyütmek için tıklayın</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Üst Satır: Kimlik Ön (Sol) + Kimlik Arka (Sağ) */}
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentImageModal src={signedUrls.idFront} alt="Kimlik Ön Yüz" label="Kimlik Ön Yüz" />
          <DocumentImageModal
            src={signedUrls.idBack}
            alt="Kimlik Arka Yüz"
            label="Kimlik Arka Yüz"
          />
        </div>

        {/* Alt Satır: Selfie (Ortalanmış, sabit yükseklik) */}
        <div className="flex justify-center">
          <DocumentImageModal
            src={signedUrls.selfie}
            alt="Selfie"
            label="Selfie"
            className="w-full md:w-1/2"
            thumbnailHeight={200}
          />
        </div>

        {/* Yüz Karşılaştırma Skoru */}
        {faceMatchScore !== undefined && faceMatchScore > 0 && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-2">Yüz Karşılaştırma Skoru</p>
            <div className="flex items-center gap-3">
              <Progress value={faceMatchScore * 100} className="flex-1" />
              <span
                className={`font-bold ${
                  faceMatchScore >= 0.8
                    ? "text-green-600"
                    : faceMatchScore >= 0.5
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {Math.round(faceMatchScore * 100)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
