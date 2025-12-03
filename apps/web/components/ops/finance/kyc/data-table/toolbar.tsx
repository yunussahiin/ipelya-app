"use client";

import { Table } from "@tanstack/react-table";
import { X, Search, SlidersHorizontal, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { KYCUserGroup } from "./types";

interface DataTableToolbarProps {
  table: Table<KYCUserGroup>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

const statusOptions = [
  { value: "pending", label: "Bekleyen", color: "bg-yellow-500" },
  { value: "approved", label: "Onaylı", color: "bg-green-500" },
  { value: "rejected", label: "Reddedilmiş", color: "bg-red-500" }
];

const recommendationOptions = [
  { value: "auto_approve", label: "Otomatik Onay" },
  { value: "manual_review", label: "Manuel İnceleme" },
  { value: "auto_reject", label: "Otomatik Red" },
  { value: "none", label: "Belirsiz" }
];

export function DataTableToolbar({ table, globalFilter, setGlobalFilter }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

  const statusColumn = table.getColumn("status");
  const recommendationColumn = table.getColumn("recommendation");

  const selectedStatuses = (statusColumn?.getFilterValue() as string[]) || [];
  const selectedRecommendations = (recommendationColumn?.getFilterValue() as string[]) || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Üst Satır: Arama ve Filtreler */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Global Arama */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kullanıcı ara..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Durum Filtresi */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Durum
              {selectedStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  {selectedStatuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Duruma Göre Filtrele</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedStatuses.includes(option.value)}
                onCheckedChange={(checked) => {
                  const newValue = checked
                    ? [...selectedStatuses, option.value]
                    : selectedStatuses.filter((v) => v !== option.value);
                  statusColumn?.setFilterValue(newValue.length ? newValue : undefined);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${option.color}`} />
                  {option.label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Öneri Filtresi */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Öneri
              {selectedRecommendations.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  {selectedRecommendations.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Öneriye Göre Filtrele</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recommendationOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={selectedRecommendations.includes(option.value)}
                onCheckedChange={(checked) => {
                  const newValue = checked
                    ? [...selectedRecommendations, option.value]
                    : selectedRecommendations.filter((v) => v !== option.value);
                  recommendationColumn?.setFilterValue(newValue.length ? newValue : undefined);
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Kolon Görünürlüğü */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Kolonları Göster/Gizle</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnLabels: Record<string, string> = {
                  creator: "Kullanıcı",
                  fullName: "Ad Soyad",
                  totalApplications: "Başvuru Sayısı",
                  statusSummary: "Durum Özeti",
                  status: "Son Durum",
                  score: "Skor",
                  recommendation: "Öneri",
                  createdAt: "Son Başvuru",
                  actions: "İşlemler"
                };
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {columnLabels[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtreleri Temizle */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter("");
            }}
            className="gap-2"
          >
            Temizle
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Alt Satır: Seçili Filtreler */}
      {(selectedStatuses.length > 0 || selectedRecommendations.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
          {selectedStatuses.map((status) => {
            const option = statusOptions.find((o) => o.value === status);
            return (
              <Badge
                key={status}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  const newValue = selectedStatuses.filter((v) => v !== status);
                  statusColumn?.setFilterValue(newValue.length ? newValue : undefined);
                }}
              >
                {option?.label}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {selectedRecommendations.map((rec) => {
            const option = recommendationOptions.find((o) => o.value === rec);
            return (
              <Badge
                key={rec}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  const newValue = selectedRecommendations.filter((v) => v !== rec);
                  recommendationColumn?.setFilterValue(newValue.length ? newValue : undefined);
                }}
              >
                {option?.label}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
