"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PreviousApplication {
  id: string;
  level: "basic" | "full";
  status: "pending" | "approved" | "rejected";
  first_name: string;
  last_name: string;
  birth_date: string | null;
  id_number: string | null;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  auto_score: number | null;
  auto_recommendation: string | null;
  ocr_form_match: boolean | null;
  face_detection_passed: boolean | null;
  reviewer?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface PreviousApplicationsCardProps {
  applications: PreviousApplication[];
  currentApplicationId: string;
}

// ─────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PreviousApplication["status"] }) {
  const config = {
    pending: {
      label: "Beklemede",
      variant: "outline" as const,
      className: "border-yellow-500 text-yellow-600 dark:text-yellow-400",
      icon: Clock
    },
    approved: {
      label: "Onaylandı",
      variant: "default" as const,
      className: "bg-green-500",
      icon: CheckCircle
    },
    rejected: {
      label: "Reddedildi",
      variant: "destructive" as const,
      className: "",
      icon: XCircle
    }
  };

  const { label, variant, className, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }),
    time: date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

function ApplicationDetailModal({
  application,
  open,
  onClose
}: {
  application: PreviousApplication | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Başvuru Detayı
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Durum</span>
              <StatusBadge status={application.status} />
            </div>

            <Separator />

            {/* Kişisel Bilgiler */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Kişisel Bilgiler
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ad Soyad</span>
                  <span className="font-medium">
                    {application.first_name} {application.last_name}
                  </span>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seviye</span>
                  <Badge variant="outline">
                    {application.level === "basic" ? "Temel" : "Tam"} Doğrulama
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tarihler */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tarihler
              </h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Başvuru Tarihi</span>
                  <span>{new Date(application.created_at).toLocaleString("tr-TR")}</span>
                </div>
                {application.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İnceleme Tarihi</span>
                    <span>{new Date(application.reviewed_at).toLocaleString("tr-TR")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Otomatik Doğrulama */}
            {(application.auto_score !== null ||
              application.ocr_form_match !== null ||
              application.face_detection_passed !== null) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Otomatik Doğrulama
                  </h4>
                  <div className="grid gap-2 text-sm">
                    {application.auto_score !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Genel Skor</span>
                        <span
                          className={cn(
                            "font-medium",
                            application.auto_score >= 0.8
                              ? "text-green-600"
                              : application.auto_score >= 0.5
                                ? "text-yellow-600"
                                : "text-red-600"
                          )}
                        >
                          {Math.round(application.auto_score * 100)}%
                        </span>
                      </div>
                    )}
                    {application.ocr_form_match !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OCR Eşleşme</span>
                        {application.ocr_form_match ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Eşleşiyor
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Eşleşmiyor
                          </Badge>
                        )}
                      </div>
                    )}
                    {application.face_detection_passed !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Yüz Algılama</span>
                        {application.face_detection_passed ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Başarılı
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Başarısız
                          </Badge>
                        )}
                      </div>
                    )}
                    {application.auto_recommendation && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Öneri</span>
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
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Red Sebebi - Detaylı Tablo */}
            {application.status === "rejected" && application.rejection_reason && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Reddedilme Detayları
                  </h4>
                  <div className="rounded-md border border-destructive/20 overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium bg-destructive/5 w-32">Sebep</TableCell>
                          <TableCell className="bg-destructive/5">
                            {application.rejection_reason}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium w-32">İnceleme Tarihi</TableCell>
                          <TableCell>
                            {application.reviewed_at
                              ? new Date(application.reviewed_at).toLocaleString("tr-TR")
                              : "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium w-32">İnceleyen</TableCell>
                          <TableCell>
                            {application.reviewer
                              ? application.reviewer.full_name || application.reviewer.email
                              : "-"}
                          </TableCell>
                        </TableRow>
                        {application.auto_score !== null && (
                          <TableRow>
                            <TableCell className="font-medium w-32">Otomatik Skor</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-medium",
                                  application.auto_score >= 0.8
                                    ? "text-green-600"
                                    : application.auto_score >= 0.5
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                )}
                              >
                                {Math.round(application.auto_score * 100)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        )}
                        {application.auto_recommendation && (
                          <TableRow>
                            <TableCell className="font-medium w-32">Sistem Önerisi</TableCell>
                            <TableCell>
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
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {/* Onay Bilgisi */}
            {application.status === "approved" && application.reviewer && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Onay Bilgisi
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Onaylayan: {application.reviewer.full_name || application.reviewer.email}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

export function PreviousApplicationsCard({
  applications,
  currentApplicationId
}: PreviousApplicationsCardProps) {
  const [selectedApplication, setSelectedApplication] = useState<PreviousApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Mevcut başvuru hariç önceki başvurular - tarihe göre sıralı
  const previousApplications = useMemo(() => {
    return applications
      .filter((app) => app.id !== currentApplicationId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [applications, currentApplicationId]);

  // Pagination hesaplamaları
  const totalPages = Math.ceil(previousApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedApplications = previousApplications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (previousApplications.length === 0) {
    return null;
  }

  const handleViewDetails = (application: PreviousApplication) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Önceki Başvurular
            </div>
            <Badge variant="secondary">{previousApplications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tablo */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih / Saat</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplications.map((app) => {
                  const { date, time } = formatDateTime(app.created_at);
                  return (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleViewDetails(app)}
                    >
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.first_name} {app.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {app.level === "basic" ? "Temel" : "Tam"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(app);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {startIndex + 1}-
                {Math.min(startIndex + ITEMS_PER_PAGE, previousApplications.length)} /{" "}
                {previousApplications.length} başvuru
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ApplicationDetailModal
        application={selectedApplication}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
