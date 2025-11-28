"use client";

import { Table } from "@tanstack/react-table";
import { IconRefresh, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const actionTypes = [
  { label: "Gizlendi", value: "hide" },
  { label: "Gösterildi", value: "unhide" },
  { label: "Silindi", value: "delete" },
  { label: "Geri Yüklendi", value: "restore" },
  { label: "Uyarıldı", value: "warn" }
];

const targetTypes = [
  { label: "Post", value: "post" },
  { label: "Vibe", value: "mini_post" },
  { label: "Anket", value: "poll" },
  { label: "Ses", value: "voice_moment" },
  { label: "Yorum", value: "comment" }
];

const notificationStatus = [
  { label: "Gönderildi", value: "true" },
  { label: "Gönderilmedi", value: "false" }
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
          <Input
            placeholder="Kullanıcı ara..."
            value={(table.getColumn("target_user")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("target_user")?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[200px]"
          />
          <Input
            placeholder="Admin ara..."
            value={(table.getColumn("admin")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("admin")?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[200px]"
          />
          {table.getColumn("action_type") && (
            <DataTableFacetedFilter
              column={table.getColumn("action_type")}
              title="İşlem"
              options={actionTypes}
            />
          )}
          {table.getColumn("target_type") && (
            <DataTableFacetedFilter
              column={table.getColumn("target_type")}
              title="İçerik Türü"
              options={targetTypes}
            />
          )}
          {table.getColumn("notification_sent") && (
            <DataTableFacetedFilter
              column={table.getColumn("notification_sent")}
              title="Bildirim"
              options={notificationStatus}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Sıfırla
              <IconX className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <IconRefresh className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
