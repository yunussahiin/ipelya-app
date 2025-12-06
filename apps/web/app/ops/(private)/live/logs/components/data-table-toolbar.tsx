"use client";

import { Table } from "@tanstack/react-table";
import { RefreshCw, X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const eventTypes = [
  { label: "🟢 Oda Başlatıldı", value: "room_started" },
  { label: "🔴 Oda Sonlandırıldı", value: "room_finished" },
  { label: "👤 Katılımcı Katıldı", value: "participant_joined" },
  { label: "👋 Katılımcı Ayrıldı", value: "participant_left" },
  { label: "📡 Track Yayınlandı", value: "track_published" },
  { label: "📴 Track Kaldırıldı", value: "track_unpublished" }
];

const statusTypes = [
  { label: "Başarılı", value: "success" },
  { label: "Hatalı", value: "error" },
  { label: "Atlandı", value: "skipped" }
];

export function DataTableToolbar<TData>({
  table,
  onRefresh,
  isLoading
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Oda adı ara..."
              value={(table.getColumn("room_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("room_name")?.setFilterValue(event.target.value)}
              className="h-8 w-[150px] lg:w-[200px] pl-9"
            />
          </div>
          <Input
            placeholder="Kullanıcı ara..."
            value={(table.getColumn("participant_profile")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("participant_profile")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[180px]"
          />
          {table.getColumn("event_type") && (
            <DataTableFacetedFilter
              column={table.getColumn("event_type")}
              title="Event Tipi"
              options={eventTypes}
            />
          )}
          {table.getColumn("processing_status") && (
            <DataTableFacetedFilter
              column={table.getColumn("processing_status")}
              title="Durum"
              options={statusTypes}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Sıfırla
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
