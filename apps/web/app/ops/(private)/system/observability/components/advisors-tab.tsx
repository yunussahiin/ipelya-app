"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import type { PerformanceAdvisor } from "../types";

interface AdvisorsTabProps {
  advisors: PerformanceAdvisor[];
}

export function AdvisorsTab({ advisors }: AdvisorsTabProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performans Önerileri</CardTitle>
              <CardDescription>Supabase Database Linter sonuçları</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Database Linter</p>
                <div className="text-xs space-y-1 mt-2">
                  <p>Supabase Dashboard üzerinden erişilebilir</p>
                  <p className="text-muted-foreground mt-1">
                    Database → Database Linter → Run Linter
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {advisors.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {advisors.map((advisor, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      advisor.level === "WARN"
                        ? "border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950"
                        : advisor.level === "ERROR"
                          ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"
                          : "border-border bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {advisor.level === "WARN" ? (
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                      ) : advisor.level === "ERROR" ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{advisor.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{advisor.detail}</p>
                        {advisor.remediation && (
                          <a
                            href={advisor.remediation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            Çözüm için tıklayın
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Şu an için performans önerisi yok</p>
              <p className="text-sm mt-2">
                Supabase Dashboard üzerinden Database Linter kontrol edilebilir
              </p>
              <a
                href="https://supabase.com/dashboard/project/_/database/linter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-4 inline-flex items-center gap-1"
              >
                Database Linter aç
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
