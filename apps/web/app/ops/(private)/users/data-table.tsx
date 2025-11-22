"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import {
  ChevronDown,
  Search,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Ban
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { UserDetailModal } from "./user-detail-modal";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    type: "ban" | "delete";
    open: boolean;
  }>({
    type: "ban",
    open: false
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  // Global filter across all columns
  React.useEffect(() => {
    // Filter across multiple columns
    const filtered = data.filter((row: any) => {
      const searchTerm = searchValue.toLowerCase();
      return (
        row.display_name?.toLowerCase().includes(searchTerm) ||
        row.username?.toLowerCase().includes(searchTerm) ||
        row.email?.toLowerCase().includes(searchTerm) ||
        row.role?.toLowerCase().includes(searchTerm) ||
        row.onboarding_step?.toString().includes(searchTerm) ||
        row.shadow_profile_active?.toString().includes(searchTerm)
      );
    });

    if (searchValue) {
      table.getColumn("display_name")?.setFilterValue(searchValue);
    } else {
      table.getColumn("display_name")?.setFilterValue("");
    }
  }, [searchValue, table, data]);

  // Expose openUserDetail function globally for columns to use
  React.useEffect(() => {
    (window as any).openUserDetail = async (user: any) => {
      try {
        // Fetch full user data including onboarding_data from Supabase
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const fullUserData = await response.json();
          setSelectedUser(fullUserData);
        } else {
          // Fallback to passed user if API fails
          setSelectedUser(user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback to passed user if fetch fails
        setSelectedUser(user);
      }
      setModalOpen(true);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim, email, ara..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 w-64"
          />
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant={table.getFilteredSelectedRowModel().rows.length > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (table.getFilteredSelectedRowModel().rows.length > 0) {
                setConfirmDialog({ type: "ban", open: true });
              }
            }}
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            className="gap-2"
          >
            <Ban className="h-4 w-4" />
            Yasakla ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
          <Button
            variant={
              table.getFilteredSelectedRowModel().rows.length > 0 ? "destructive" : "outline"
            }
            size="sm"
            onClick={() => {
              if (table.getFilteredSelectedRowModel().rows.length > 0) {
                setConfirmDialog({ type: "delete", open: true });
              }
            }}
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Sil ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
          <Button
            variant={table.getFilteredSelectedRowModel().rows.length > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const selectedData = table
                .getFilteredSelectedRowModel()
                .rows.map((row) => row.original);
              const csv = [
                ["İsim", "Email", "Kullanıcı Adı", "Tip", "Durum", "Kayıt Tarihi"],
                ...selectedData.map((user) => [
                  user.display_name,
                  user.email,
                  user.username,
                  user.role,
                  user.banned_until ? "Yasaklı" : "Aktif",
                  new Date(user.created_at).toLocaleDateString("tr-TR")
                ])
              ]
                .map((row) => row.map((cell) => `"${cell}"`).join(","))
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `kullanicilar_${new Date().getTime()}.csv`;
              a.click();
            }}
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            İndir ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        </div>

        <div className="ml-auto">
          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Sütunlar
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                    {column.id === "display_name"
                      ? "Kullanıcı"
                      : column.id === "role"
                        ? "Tip"
                        : column.id === "banned_until"
                          ? "Durum"
                          : column.id === "onboarding_step"
                            ? "Onboarding"
                            : column.id === "shadow_profile_active"
                              ? "Shadow"
                              : column.id === "created_at"
                                ? "Kayıt Tarihi"
                                : column.id === "last_login_at"
                                  ? "Son Giriş"
                                  : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Kullanıcı bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} satır seçildi
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </Button>
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="gap-1"
          >
            Sonraki
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} open={modalOpen} onOpenChange={setModalOpen} />
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "ban" ? "Kullanıcıları Yasakla" : "Kullanıcıları Sil"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "ban"
                ? `${table.getFilteredSelectedRowModel().rows.length} kullanıcıyı yasaklamak istediğinizden emin misiniz?`
                : `${table.getFilteredSelectedRowModel().rows.length} kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              İptal
            </Button>
            <Button
              variant={confirmDialog.type === "ban" ? "default" : "destructive"}
              onClick={() => {
                const selectedIds = table
                  .getFilteredSelectedRowModel()
                  .rows.map((row) => row.original.id);
                console.log(
                  confirmDialog.type === "ban" ? "Ban users:" : "Delete users:",
                  selectedIds
                );
                // TODO: Implement API calls
                setConfirmDialog({ ...confirmDialog, open: false });
                table.resetRowSelection();
              }}
            >
              {confirmDialog.type === "ban" ? "Yasakla" : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
