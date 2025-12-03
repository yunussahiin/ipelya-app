"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { KYCStatusBadge } from "@/components/ops/finance";
import { cn } from "@/lib/utils";
import type { KYCUserGroup, KYCApplication } from "./types";

// ─────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────

function RecommendationBadge({ recommendation }: { recommendation?: string | null }) {
  if (!recommendation) return <span className="text-muted-foreground">-</span>;

  const config: Record<string, { label: string; className: string }> = {
    auto_approve: {
      label: "Otomatik Onay",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    },
    manual_review: {
      label: "Manuel İnceleme",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    },
    auto_reject: {
      label: "Otomatik Red",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  };

  const c = config[recommendation] || { label: recommendation, className: "" };

  return (
    <Badge variant="outline" className={cn("text-xs", c.className)}>
      {c.label}
    </Badge>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">-</span>;

  const percentage = Math.round(score * 100);
  const colorClass =
    score >= 0.8
      ? "text-green-600 dark:text-green-400"
      : score >= 0.5
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return <span className={cn("font-medium", colorClass)}>{percentage}%</span>;
}

function StatusSummary({ group }: { group: KYCUserGroup }) {
  return (
    <div className="flex items-center gap-1">
      {group.hasPending && (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-600 dark:text-yellow-400 text-xs px-1.5"
        >
          <Clock className="h-3 w-3 mr-0.5" />
          {group.applications.filter((a) => a.status === "pending").length}
        </Badge>
      )}
      {group.hasApproved && (
        <Badge
          variant="outline"
          className="border-green-500 text-green-600 dark:text-green-400 text-xs px-1.5"
        >
          <CheckCircle className="h-3 w-3 mr-0.5" />
          {group.applications.filter((a) => a.status === "approved").length}
        </Badge>
      )}
      {group.hasRejected && (
        <Badge
          variant="outline"
          className="border-red-500 text-red-600 dark:text-red-400 text-xs px-1.5"
        >
          <XCircle className="h-3 w-3 mr-0.5" />
          {group.applications.filter((a) => a.status === "rejected").length}
        </Badge>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Columns (User Groups)
// ─────────────────────────────────────────────────────────

export const columns: ColumnDef<KYCUserGroup>[] = [
  // Expand/Collapse
  {
    id: "expand",
    header: () => null,
    cell: ({ row }) => {
      const canExpand = row.original.totalApplications > 1;
      if (!canExpand) return <div className="w-6" />;

      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false
  },
  // Select
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tümünü seç"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Satır seç"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  // Creator
  {
    accessorKey: "creator",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Kullanıcı
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const group = row.original;
      const creator = group.creator;

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={creator?.avatar_url || undefined} />
            <AvatarFallback>{creator?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">@{creator?.username || "unknown"}</div>
            {creator?.display_name && (
              <div className="text-xs text-muted-foreground">{creator.display_name}</div>
            )}
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.creator?.username || "";
      const b = rowB.original.creator?.username || "";
      return a.localeCompare(b);
    }
  },
  // Ad Soyad (Son Başvuru)
  {
    id: "fullName",
    accessorKey: "latestApplication.first_name",
    header: "Ad Soyad",
    cell: ({ row }) => {
      const app = row.original.latestApplication;
      return (
        <span>
          {app.first_name} {app.last_name}
        </span>
      );
    }
  },
  // Başvuru Sayısı
  {
    accessorKey: "totalApplications",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Başvuru
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const total = row.original.totalApplications;
      return (
        <Badge variant="secondary" className="font-mono">
          {total}
        </Badge>
      );
    }
  },
  // Durum Özeti
  {
    id: "statusSummary",
    header: "Durum Özeti",
    cell: ({ row }) => <StatusSummary group={row.original} />
  },
  // Son Başvuru Durumu
  {
    id: "status",
    accessorFn: (row) => row.latestApplication.status,
    header: "Son Durum",
    cell: ({ row }) => {
      const app = row.original.latestApplication;
      return <KYCStatusBadge status={app.status} level={app.level} />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.latestApplication.status);
    }
  },
  // Skor
  {
    id: "score",
    accessorFn: (row) => row.latestApplication.auto_score,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Skor
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <ScoreBadge score={row.original.latestApplication.auto_score} />
  },
  // Öneri
  {
    id: "recommendation",
    accessorFn: (row) => row.latestApplication.auto_recommendation,
    header: "Öneri",
    cell: ({ row }) => (
      <RecommendationBadge recommendation={row.original.latestApplication.auto_recommendation} />
    ),
    filterFn: (row, id, value) => {
      const rec = row.original.latestApplication.auto_recommendation;
      return value.includes(rec || "none");
    }
  },
  // Son Başvuru Tarihi
  {
    id: "createdAt",
    accessorFn: (row) => row.latestApplication.created_at,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Son Başvuru
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.latestApplication.created_at);
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString("tr-TR")}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = new Date(rowA.original.latestApplication.created_at).getTime();
      const b = new Date(rowB.original.latestApplication.created_at).getTime();
      return a - b;
    }
  },
  // Actions
  {
    id: "actions",
    cell: ({ row }) => {
      const group = row.original;
      const latestApp = group.latestApplication;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/ops/kyc/${latestApp.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Son Başvuruyu İncele
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(group.creator_id)}>
              Creator ID Kopyala
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(latestApp.id)}>
              Başvuru ID Kopyala
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

// ─────────────────────────────────────────────────────────
// Sub-Row Columns (Applications)
// ─────────────────────────────────────────────────────────

export const subRowColumns: ColumnDef<KYCApplication>[] = [
  {
    accessorKey: "id",
    header: "Başvuru ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id.slice(0, 8)}...
      </span>
    )
  },
  {
    accessorKey: "first_name",
    header: "Ad Soyad",
    cell: ({ row }) => (
      <span>
        {row.original.first_name} {row.original.last_name}
      </span>
    )
  },
  {
    accessorKey: "level",
    header: "Seviye",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.level === "basic" ? "Temel" : "Tam"}</Badge>
    )
  },
  {
    accessorKey: "status",
    header: "Durum",
    cell: ({ row }) => <KYCStatusBadge status={row.original.status} />
  },
  {
    accessorKey: "auto_score",
    header: "Skor",
    cell: ({ row }) => <ScoreBadge score={row.original.auto_score} />
  },
  {
    accessorKey: "auto_recommendation",
    header: "Öneri",
    cell: ({ row }) => <RecommendationBadge recommendation={row.original.auto_recommendation} />
  },
  {
    accessorKey: "created_at",
    header: "Tarih",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.created_at).toLocaleDateString("tr-TR")}
      </span>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/ops/kyc/${row.original.id}`}>
          <Eye className="h-4 w-4 mr-1" />
          İncele
        </Link>
      </Button>
    )
  }
];
