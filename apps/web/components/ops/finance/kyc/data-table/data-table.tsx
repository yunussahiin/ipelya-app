"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  Row
} from "@tanstack/react-table";
import Link from "next/link";
import { Eye, ChevronRight, ChevronLeft } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KYCStatusBadge } from "@/components/ops/finance";
import { cn } from "@/lib/utils";
import { DataTableToolbar } from "./toolbar";
import { DataTablePagination } from "./pagination";
import type { KYCUserGroup, KYCApplication } from "./types";

// ─────────────────────────────────────────────────────────
// Sub Row Component
// ─────────────────────────────────────────────────────────

const SUB_PAGE_SIZE = 5;

function SubRowContent({ applications }: { applications: KYCApplication[] }) {
  const [currentPage, setCurrentPage] = React.useState(1);

  // Tarihe göre sırala (en yeni üstte)
  const sortedApps = React.useMemo(() => {
    return [...applications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [applications]);

  const totalPages = Math.ceil(sortedApps.length / SUB_PAGE_SIZE);
  const startIndex = (currentPage - 1) * SUB_PAGE_SIZE;
  const paginatedApps = sortedApps.slice(startIndex, startIndex + SUB_PAGE_SIZE);

  return (
    <div className="px-8 py-3 bg-muted/30">
      <div className="text-sm font-medium mb-2 text-muted-foreground">
        Tüm Başvurular ({applications.length})
      </div>
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Seviye</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Skor</TableHead>
              <TableHead>Öneri</TableHead>
              <TableHead>Tarih / Saat</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApps.map((app, index) => {
              const date = new Date(app.created_at);
              const isFirst = currentPage === 1 && index === 0;
              return (
                <TableRow
                  key={app.id}
                  className={cn(
                    isFirst ? "bg-accent/30" : "",
                    "cursor-pointer hover:bg-muted/50 transition-colors"
                  )}
                  onClick={() => (window.location.href = `/ops/kyc/${app.id}`)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {app.id.slice(0, 8)}...
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
                    <KYCStatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    {app.auto_score !== null ? (
                      <span
                        className={cn(
                          "font-medium",
                          app.auto_score >= 0.8
                            ? "text-green-600"
                            : app.auto_score >= 0.5
                              ? "text-yellow-600"
                              : "text-red-600"
                        )}
                      >
                        {Math.round(app.auto_score * 100)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {app.auto_recommendation ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          app.auto_recommendation === "auto_approve" &&
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          app.auto_recommendation === "manual_review" &&
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          app.auto_recommendation === "auto_reject" &&
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}
                      >
                        {app.auto_recommendation === "auto_approve"
                          ? "Oto. Onay"
                          : app.auto_recommendation === "manual_review"
                            ? "Manuel"
                            : "Oto. Red"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{date.toLocaleDateString("tr-TR")}</div>
                      <div className="text-xs text-muted-foreground">
                        {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/ops/kyc/${app.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - sadece 5'ten fazla başvuru varsa */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + SUB_PAGE_SIZE, sortedApps.length)} /{" "}
            {sortedApps.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Data Table
// ─────────────────────────────────────────────────────────

interface KYCDataTableProps {
  columns: ColumnDef<KYCUserGroup>[];
  data: KYCUserGroup[];
}

export function KYCDataTable({ columns, data }: KYCDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pageSize, setPageSize] = React.useState(20);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      expanded
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const creator = row.original.creator;
      const searchValue = filterValue.toLowerCase();

      // Username, display_name, first_name, last_name'de ara
      const username = creator?.username?.toLowerCase() || "";
      const displayName = creator?.display_name?.toLowerCase() || "";
      const firstName = row.original.latestApplication.first_name?.toLowerCase() || "";
      const lastName = row.original.latestApplication.last_name?.toLowerCase() || "";

      return (
        username.includes(searchValue) ||
        displayName.includes(searchValue) ||
        firstName.includes(searchValue) ||
        lastName.includes(searchValue)
      );
    },
    getRowCanExpand: (row) => row.original.totalApplications > 1
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  {/* Main Row */}
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      row.getIsExpanded() && "bg-muted/50",
                      row.original.latestApplication.status === "pending" &&
                        "border-l-2 border-l-yellow-500"
                    )}
                    onClick={() => {
                      if (row.getCanExpand()) {
                        row.toggleExpanded();
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expanded Sub Row */}
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                        <SubRowContent applications={row.original.applications} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
