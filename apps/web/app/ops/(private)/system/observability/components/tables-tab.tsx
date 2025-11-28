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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Database } from "lucide-react";
import type { TableSize } from "../types";

interface TablesTabProps {
  tableSizes: TableSize[];
}

export function TablesTab({ tableSizes }: TablesTabProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tablo Boyutları</CardTitle>
              <CardDescription>En büyük 20 tablo (public schema)</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Tablo Boyut Metrikleri</p>
                <div className="text-xs space-y-1 mt-2">
                  <p>
                    <strong>Satır:</strong> Tahmini satır sayısı (pg_class.reltuples)
                  </p>
                  <p>
                    <strong>Toplam:</strong> Tablo + İndeks + TOAST boyutu
                  </p>
                  <p>
                    <strong>Tablo:</strong> Sadece tablo verisi
                  </p>
                  <p>
                    <strong>İndeks:</strong> Tüm indekslerin toplam boyutu
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {tableSizes.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tablo</TableHead>
                    <TableHead className="text-right">Satır</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Tablo</TableHead>
                    <TableHead className="text-right">İndeks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableSizes.map((table) => (
                    <TableRow key={table.table_name} className="hover:bg-accent">
                      <TableCell className="font-mono">{table.table_name}</TableCell>
                      <TableCell className="text-right">
                        {table.row_count >= 0 ? table.row_count.toLocaleString("tr-TR") : "~"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{table.total_size}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {table.table_size}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {table.index_size}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tablo verisi bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
