"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Info, TrendingUp } from "lucide-react";
import type { IndexUsage } from "../types";

interface IndexesTabProps {
  indexUsage: IndexUsage[];
}

export function IndexesTab({ indexUsage }: IndexesTabProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İndeks Kullanımı</CardTitle>
              <CardDescription>En çok kullanılan indeksler (tarama sayısına göre)</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">İndeks Metrikleri</p>
                <div className="text-xs space-y-1 mt-2">
                  <p>
                    <strong>Tarama:</strong> İndeksin kaç kez kullanıldığı
                  </p>
                  <p>
                    <strong>Okunan:</strong> İndeks üzerinden okunan satır sayısı
                  </p>
                  <p>
                    <strong>Getirilen:</strong> Tabloya gidip alınan satır sayısı
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Tarama = 0 olan indeksler kullanılmıyor olabilir
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {indexUsage.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tablo</TableHead>
                    <TableHead>İndeks</TableHead>
                    <TableHead className="text-right">Boyut</TableHead>
                    <TableHead className="text-right">Tarama</TableHead>
                    <TableHead className="text-right">Okunan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indexUsage.map((idx, i) => (
                    <TableRow key={i} className="hover:bg-accent">
                      <TableCell className="font-mono text-sm">{idx.table_name}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="font-mono text-sm cursor-help">{idx.index_name}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{idx.index_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tablo: {idx.table_name}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">{idx.index_size}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={idx.index_scans > 1000 ? "default" : "secondary"}
                          className="font-mono"
                        >
                          {idx.index_scans?.toLocaleString("tr-TR") || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {idx.rows_read?.toLocaleString("tr-TR") || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>İndeks kullanım verisi bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
