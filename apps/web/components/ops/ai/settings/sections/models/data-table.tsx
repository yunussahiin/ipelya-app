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
  useReactTable
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Search,
  Settings2,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { ModelData } from "./columns";

interface Endpoint {
  name: string;
  model_name: string;
  context_length: number;
  pricing: {
    prompt: string | number;
    completion: string | number;
  };
  provider_name: string;
  tag: string;
  max_completion_tokens: number | null;
  status?: string;
  uptime_last_30m: number | null;
  supports_implicit_caching: boolean;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends ModelData, TValue>({
  columns,
  data
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Endpoint modal state
  const [selectedModel, setSelectedModel] = React.useState<ModelData | null>(null);
  const [endpoints, setEndpoints] = React.useState<Endpoint[]>([]);
  const [endpointsLoading, setEndpointsLoading] = React.useState(false);
  const [endpointsError, setEndpointsError] = React.useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const model = row.original as ModelData;
      const search = filterValue.toLowerCase();
      return model.id.toLowerCase().includes(search) || model.name.toLowerCase().includes(search);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 20
      }
    }
  });

  const fetchEndpoints = async (model: ModelData) => {
    setSelectedModel(model);
    setEndpointsLoading(true);
    setEndpointsError(null);
    setEndpoints([]);

    try {
      const response = await fetch(`/api/ops/ai/endpoints?model=${encodeURIComponent(model.id)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch endpoints");
      }
      const result = await response.json();
      setEndpoints(result.endpoints || []);
    } catch (err) {
      setEndpointsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setEndpointsLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status || status === "0") {
      return (
        <Badge variant="default" className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (status === "-1" || status === "-2") {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Limited
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Down
      </Badge>
    );
  };

  const formatEndpointPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (num === 0) return "Free";
    return `$${(num * 1000000).toFixed(4)}/M`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Model ara..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={(table.getColumn("pricing")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("pricing")?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Fiyat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="free">Ücretsiz</SelectItem>
              <SelectItem value="paid">Ücretli</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn("capabilities")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("capabilities")?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Özellik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="tools">Tool Destekli</SelectItem>
              <SelectItem value="vision">Vision</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "id"
                      ? "Model"
                      : column.id === "pricing"
                        ? "Fiyat"
                        : column.id === "context_length"
                          ? "Context"
                          : column.id === "capabilities"
                            ? "Özellikler"
                            : column.id === "temperature"
                              ? "Sıcaklık"
                              : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => fetchEndpoints(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} modelden{" "}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          arası gösteriliyor
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Endpoints Modal */}
      <Dialog open={!!selectedModel} onOpenChange={(open) => !open && setSelectedModel(null)}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {selectedModel?.name || "Model Endpoints"}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{selectedModel?.id}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {endpointsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : endpointsError ? (
              <div className="text-center py-12">
                <p className="text-sm text-destructive">{endpointsError}</p>
              </div>
            ) : endpoints.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead>Prompt</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead className="text-right">Uptime</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoints.map((endpoint, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{endpoint.provider_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {endpoint.tag || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {endpoint.context_length?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatEndpointPrice(endpoint.pricing.prompt)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatEndpointPrice(endpoint.pricing.completion)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-right">
                          {endpoint.uptime_last_30m != null
                            ? `${(endpoint.uptime_last_30m * 100).toFixed(0)}%`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(endpoint.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Bu model için endpoint bulunamadı.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
