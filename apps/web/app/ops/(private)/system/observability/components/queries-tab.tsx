"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Server, Eye } from "lucide-react";
import { QueryDetailDialog } from "./query-detail-dialog";
import type { SlowQuery } from "../types";

interface QueriesTabProps {
  slowQueries: SlowQuery[];
}

export function QueriesTab({ slowQueries }: QueriesTabProps) {
  const [selectedQuery, setSelectedQuery] = useState<SlowQuery | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewQuery = (query: SlowQuery) => {
    setSelectedQuery(query);
    setDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Yavaş Sorgular</CardTitle>
              <CardDescription>Ortalama süreye göre sıralı (pg_stat_statements)</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Sorgu İstatistikleri</p>
                <div className="text-xs space-y-1 mt-2">
                  <p>
                    <strong>Çağrı:</strong> Sorgunun kaç kez çalıştırıldığı
                  </p>
                  <p>
                    <strong>Toplam:</strong> Tüm çağrıların toplam süresi
                  </p>
                  <p>
                    <strong>Ortalama:</strong> Çağrı başına ortalama süre
                  </p>
                  <p>
                    <strong>Satır:</strong> Dönen toplam satır sayısı
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    pg_stat_statements extension gerektirir
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {slowQueries.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[350px]">Sorgu</TableHead>
                    <TableHead className="text-right">Çağrı</TableHead>
                    <TableHead className="text-right">Toplam (ms)</TableHead>
                    <TableHead className="text-right">Ort. (ms)</TableHead>
                    <TableHead className="text-right">Satır</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowQueries.map((q, i) => (
                    <TableRow key={i} className="hover:bg-accent">
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="font-mono text-xs max-w-[350px] truncate block cursor-help">
                              {q.query}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <pre className="text-xs whitespace-pre-wrap">{q.query}</pre>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {q.calls?.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {q.total_time?.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            q.mean_time < 10
                              ? "default"
                              : q.mean_time < 100
                                ? "secondary"
                                : "destructive"
                          }
                          className="font-mono"
                        >
                          {q.mean_time?.toLocaleString("tr-TR")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {q.rows?.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewQuery(q)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>pg_stat_statements extension aktif değil veya veri yok</p>
              <p className="text-xs mt-2">
                Extension aktifleştirmek için: CREATE EXTENSION pg_stat_statements;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <QueryDetailDialog query={selectedQuery} open={dialogOpen} onOpenChange={setDialogOpen} />
    </TooltipProvider>
  );
}
