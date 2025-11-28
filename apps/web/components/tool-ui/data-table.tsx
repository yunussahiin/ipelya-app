"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Types
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export type FormatConfig =
  | { kind: "number"; decimals?: number; unit?: string }
  | { kind: "currency"; currency: string; decimals?: number }
  | { kind: "percent"; basis: "fraction" | "unit"; decimals?: number; showSign?: boolean }
  | { kind: "delta"; decimals?: number; upIsPositive?: boolean; showSign?: boolean }
  | { kind: "date"; dateFormat?: "short" | "long" | "relative" }
  | { kind: "boolean"; labels?: { true: string; false: string } }
  | { kind: "link"; hrefKey?: string; external?: boolean }
  | { kind: "badge"; colorMap?: Record<string, Tone> }
  | { kind: "status"; statusMap: Record<string, { tone: Tone; label?: string }> }
  | { kind: "array"; maxVisible?: number };

export interface Column<T> {
  key: keyof T;
  label: string;
  format?: FormatConfig;
  priority?: "primary" | "secondary" | "tertiary";
  sortable?: boolean;
  align?: "left" | "right" | "center";
  truncate?: boolean;
}

export interface Action {
  id: string;
  label: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  rowIdKey: keyof T;
  locale?: string;
  defaultSort?: { by?: keyof T; direction?: "asc" | "desc" };
  sort?: { by?: keyof T; direction?: "asc" | "desc" };
  onSortChange?: (sort: { by?: keyof T; direction?: "asc" | "desc" }) => void;
  footerActions?: Action[];
  onFooterAction?: (actionId: string) => void;
  maxRows?: number;
  className?: string;
}

// Tone to Tailwind class mapping
const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  success: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  danger: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
};

// Format value components
export function NumberValue({
  value,
  options,
  locale = "tr-TR"
}: {
  value: number;
  options: Extract<FormatConfig, { kind: "number" }>;
  locale?: string;
}) {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: options.decimals,
    maximumFractionDigits: options.decimals
  }).format(value);
  return (
    <span>
      {formatted}
      {options.unit || ""}
    </span>
  );
}

export function CurrencyValue({
  value,
  options,
  locale = "tr-TR"
}: {
  value: number;
  options: Extract<FormatConfig, { kind: "currency" }>;
  locale?: string;
}) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: options.currency,
    minimumFractionDigits: options.decimals ?? 2,
    maximumFractionDigits: options.decimals ?? 2
  }).format(value);
  return <span>{formatted}</span>;
}

export function PercentValue({
  value,
  options
}: {
  value: number;
  options: Extract<FormatConfig, { kind: "percent" }>;
}) {
  const actualValue = options.basis === "fraction" ? value * 100 : value;
  const sign = options.showSign && actualValue > 0 ? "+" : "";
  return (
    <span>
      {sign}
      {actualValue.toFixed(options.decimals ?? 0)}%
    </span>
  );
}

export function DeltaValue({
  value,
  options
}: {
  value: number;
  options: Extract<FormatConfig, { kind: "delta" }>;
}) {
  const isPositive = options.upIsPositive !== false ? value > 0 : value < 0;
  const sign = options.showSign && value > 0 ? "+" : "";
  const colorClass = isPositive
    ? "text-green-600 dark:text-green-400"
    : value < 0
      ? "text-red-600 dark:text-red-400"
      : "";
  return (
    <span className={colorClass}>
      {sign}
      {value.toFixed(options.decimals ?? 0)}
    </span>
  );
}

export function DateValue({
  value,
  options,
  locale = "tr-TR"
}: {
  value: string | null | undefined;
  options: Extract<FormatConfig, { kind: "date" }>;
  locale?: string;
}) {
  // Null/undefined/empty check
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  const date = new Date(value);

  // Invalid date check
  if (isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (options.dateFormat === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return <span>şimdi</span>;
    if (diffMinutes < 60) return <span>{diffMinutes} dk önce</span>;
    if (diffHours < 24) return <span>{diffHours} saat önce</span>;
    if (diffDays < 7) return <span>{diffDays} gün önce</span>;
    if (diffDays < 30) return <span>{Math.floor(diffDays / 7)} hafta önce</span>;
    return <span>{Math.floor(diffDays / 30)} ay önce</span>;
  }

  const formatOptions: Intl.DateTimeFormatOptions =
    options.dateFormat === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" };

  return <span>{date.toLocaleDateString(locale, formatOptions)}</span>;
}

export function BooleanValue({
  value,
  options
}: {
  value: boolean;
  options: Extract<FormatConfig, { kind: "boolean" }>;
}) {
  const labels = options.labels || { true: "Evet", false: "Hayır" };
  return (
    <span className={value ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
      {value ? labels.true : labels.false}
    </span>
  );
}

export function LinkValue({
  value,
  row,
  options
}: {
  value: string;
  row?: Record<string, unknown>;
  options: Extract<FormatConfig, { kind: "link" }>;
}) {
  const href = options.hrefKey && row ? String(row[options.hrefKey]) : value;
  return (
    <a
      href={href}
      target={options.external ? "_blank" : undefined}
      rel={options.external ? "noopener noreferrer" : undefined}
      className="text-primary hover:underline inline-flex items-center gap-1"
    >
      {value}
      {options.external && <ExternalLink className="size-3" />}
    </a>
  );
}

export function BadgeValue({
  value,
  options
}: {
  value: string;
  options: Extract<FormatConfig, { kind: "badge" }>;
}) {
  const tone = options.colorMap?.[value] || "neutral";
  return (
    <Badge variant="secondary" className={cn("font-normal", toneClasses[tone])}>
      {value}
    </Badge>
  );
}

export function StatusBadge({
  value,
  options
}: {
  value: string;
  options: Extract<FormatConfig, { kind: "status" }>;
}) {
  const status = options.statusMap[value];
  if (!status) return <span>{value}</span>;

  return (
    <Badge variant="secondary" className={cn("font-normal", toneClasses[status.tone])}>
      {status.label || value}
    </Badge>
  );
}

export function ArrayValue({
  value,
  options
}: {
  value: unknown[];
  options: Extract<FormatConfig, { kind: "array" }>;
}) {
  const maxVisible = options.maxVisible ?? 3;
  const visible = value.slice(0, maxVisible);
  const remaining = value.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item, i) => (
        <Badge key={i} variant="outline" className="font-normal">
          {String(item)}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

// Format cell value
function formatCellValue<T extends Record<string, unknown>>(
  value: unknown,
  format: FormatConfig | undefined,
  row: T,
  locale: string
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (!format) {
    return String(value);
  }

  switch (format.kind) {
    case "number":
      return <NumberValue value={Number(value)} options={format} locale={locale} />;
    case "currency":
      return <CurrencyValue value={Number(value)} options={format} locale={locale} />;
    case "percent":
      return <PercentValue value={Number(value)} options={format} />;
    case "delta":
      return <DeltaValue value={Number(value)} options={format} />;
    case "date":
      return (
        <DateValue value={value as string | null | undefined} options={format} locale={locale} />
      );
    case "boolean":
      return <BooleanValue value={Boolean(value)} options={format} />;
    case "link":
      return (
        <LinkValue value={String(value)} row={row as Record<string, unknown>} options={format} />
      );
    case "badge":
      return <BadgeValue value={String(value)} options={format} />;
    case "status":
      return <StatusBadge value={String(value)} options={format} />;
    case "array":
      return <ArrayValue value={Array.isArray(value) ? value : [value]} options={format} />;
    default:
      return String(value);
  }
}

// Main DataTable component
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowIdKey,
  locale = "tr-TR",
  defaultSort,
  sort: controlledSort,
  onSortChange,
  footerActions,
  onFooterAction,
  maxRows,
  className
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{ by?: keyof T; direction?: "asc" | "desc" }>(
    defaultSort || {}
  );

  const sort = controlledSort ?? internalSort;

  const handleSort = (key: keyof T) => {
    const newSort = {
      by: key,
      direction: sort.by === key && sort.direction === "asc" ? ("desc" as const) : ("asc" as const)
    };

    if (onSortChange) {
      onSortChange(newSort);
    } else {
      setInternalSort(newSort);
    }
  };

  const sortedData = useMemo(() => {
    if (!sort.by) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.by!];
      const bVal = b[sort.by!];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === "desc" ? -comparison : comparison;
    });
  }, [data, sort]);

  const displayData = maxRows ? sortedData.slice(0, maxRows) : sortedData;

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                  column.sortable !== false && "cursor-pointer select-none hover:bg-muted/50"
                )}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div
                  className={cn(
                    "flex items-center gap-1",
                    column.align === "right" && "justify-end",
                    column.align === "center" && "justify-center"
                  )}
                >
                  {column.label}
                  {column.sortable !== false && (
                    <span className="text-muted-foreground">
                      {sort.by === column.key ? (
                        sort.direction === "asc" ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-8"
              >
                Veri bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            displayData.map((row) => (
              <TableRow key={String(row[rowIdKey])}>
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.truncate && "max-w-[200px] truncate"
                    )}
                  >
                    {formatCellValue(row[column.key], column.format, row, locale)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Footer with count and actions */}
      <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground">
        <span>
          {displayData.length === data.length
            ? `${data.length} kayıt`
            : `${displayData.length} / ${data.length} kayıt gösteriliyor`}
        </span>

        {footerActions && footerActions.length > 0 && (
          <div className="flex gap-2">
            {footerActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || "outline"}
                size="sm"
                disabled={action.disabled}
                onClick={() => onFooterAction?.(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Export schema for tool output validation
export const serializableDataTableSchema = {
  type: "object",
  properties: {
    columns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          format: { type: "object" },
          priority: { type: "string" },
          sortable: { type: "boolean" },
          align: { type: "string" },
          truncate: { type: "boolean" }
        },
        required: ["key", "label"]
      }
    },
    data: { type: "array" },
    defaultSort: {
      type: "object",
      properties: {
        by: { type: "string" },
        direction: { type: "string" }
      }
    }
  },
  required: ["columns", "data"]
};
