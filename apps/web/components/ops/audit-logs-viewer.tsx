"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Copy, Check, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  profile_type: string;
  ip_address?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  profiles?:
    | {
        id: string;
        username?: string;
        email?: string;
        is_creator?: boolean;
        role?: string;
      }
    | {
        id: string;
        username?: string;
        email?: string;
        is_creator?: boolean;
        role?: string;
      }[];
}

interface AuditUser {
  id: string;
  username?: string;
  email?: string;
  is_creator?: boolean;
  role?: string;
  user_id?: string;
}

const ACTION_OPTIONS = [
  { value: "shadow_mode_enabled", label: "Shadow Mod Etkinleştirildi" },
  { value: "pin_verified", label: "PIN Doğrulandı" },
  { value: "pin_failed", label: "PIN Başarısız" },
  { value: "biometric_verified", label: "Biyometrik Doğrulandı" },
  { value: "biometric_failed", label: "Biyometrik Başarısız" },
  { value: "user_locked_by_ops", label: "Kullanıcı Kilitlendi" },
  { value: "session_terminated_by_ops", label: "Oturum Sonlandırıldı" }
];

export function AuditLogsViewer() {
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    start_date: "",
    end_date: ""
  });
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setOffset(0); // Reset to first page when filters change
  };

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", filters, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.action) params.append("action", filters.action);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const url = `/api/ops/shadow/audit-logs?${params}`;
      console.log("Fetching audit logs with URL:", url);

      const res = await fetch(url);
      if (!res.ok) {
        const error = await res.text();
        console.error("API Error:", error);
        throw new Error("Failed to fetch audit logs");
      }
      const result = await res.json();
      console.log("API Response:", result);
      return result;
    }
  });

  // Get unique users with their profile info
  const { data: usersData } = useQuery<AuditUser[]>({
    queryKey: ["audit-logs-users"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/audit-logs/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  // Group users by id (user_id) and show real profile info
  const usersByUserId = new Map<string, AuditUser>();
  (usersData || []).forEach((user) => {
    const userId = user.user_id || user.id;
    if (!usersByUserId.has(userId)) {
      usersByUserId.set(userId, { ...user, user_id: userId });
    }
  });

  const userOptions = Array.from(usersByUserId.values()).map((user) => ({
    value: user.user_id || user.id,
    username: user.username || user.email || (user.user_id || user.id).slice(0, 8),
    is_creator: user.is_creator,
    role: user.role || "user"
  }));

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const logs = data?.data || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Kullanıcı</label>
            <Button
              variant="outline"
              className="w-full mt-1 justify-start text-left"
              onClick={() => setUserModalOpen(true)}
            >
              {filters.user_id
                ? (() => {
                    const user = userOptions.find((u) => u.value === filters.user_id);
                    return user
                      ? `${user.username} ${user.is_creator ? "👑" : ""} (${user.role})`
                      : "Kullanıcı Seç";
                  })()
                : "Tüm Kullanıcılar"}
            </Button>
          </div>
          <div>
            <label className="text-sm font-medium">İşlem</label>
            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange({ ...filters, action: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tüm İşlemler" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Başlangıç Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.start_date
                    ? format(new Date(filters.start_date), "dd MMM yyyy", { locale: tr })
                    : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.start_date ? new Date(filters.start_date) : undefined}
                  onSelect={(date) =>
                    handleFilterChange({
                      ...filters,
                      start_date: date ? date.toISOString() : ""
                    })
                  }
                  locale={tr}
                  disabled={(date) =>
                    filters.end_date ? date > new Date(filters.end_date) : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium">Bitiş Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.end_date
                    ? format(new Date(filters.end_date), "dd MMM yyyy", { locale: tr })
                    : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.end_date ? new Date(filters.end_date) : undefined}
                  onSelect={(date) =>
                    handleFilterChange({
                      ...filters,
                      end_date: date ? date.toISOString() : ""
                    })
                  }
                  locale={tr}
                  disabled={(date) =>
                    filters.start_date ? date < new Date(filters.start_date) : false
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Denetim Günlükleri</CardTitle>
          <CardDescription>
            {logs.length} / {total} günlük gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Kullanıcı ID</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Profil Türü</TableHead>
                      <TableHead>IP Adresi</TableHead>
                      <TableHead>Zaman Damgası</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Günlük bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log: AuditLog) => {
                        const profile = Array.isArray(log.profiles)
                          ? log.profiles[0]
                          : log.profiles;
                        const userLabel =
                          profile?.username || profile?.email || log.user_id.slice(0, 8);
                        const isCreator = profile?.is_creator ? "👑" : "";
                        const role = profile?.role || "user";
                        const profileTypeLabel =
                          log.profile_type === "shadow" ? "🔒 Shadow" : "👤 Real";

                        // Format action for badge
                        const actionLabel = log.action
                          .replace(/_/g, " ")
                          .split(" ")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ");

                        // Determine action badge color
                        const getActionBadgeVariant = (action: string) => {
                          if (action.includes("failed") || action.includes("locked"))
                            return "destructive";
                          if (action.includes("verified") || action.includes("enabled"))
                            return "default";
                          return "secondary";
                        };

                        // Profile type badge
                        const getProfileBadgeVariant = (type: string) => {
                          return type === "shadow" ? "outline" : "secondary";
                        };

                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm font-medium">
                              {userLabel} {isCreator}
                              <div className="text-xs text-muted-foreground">
                                {role} • {profileTypeLabel}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <span>{log.user_id.slice(0, 8)}...</span>
                                <button
                                  onClick={() => handleCopyUserId(log.user_id)}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  title="Tüm User ID'yi kopyala"
                                >
                                  {copiedId === log.user_id ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getActionBadgeVariant(log.action)}
                                className="text-xs"
                              >
                                {actionLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getProfileBadgeVariant(log.profile_type)}
                                className="text-xs"
                              >
                                {log.profile_type === "shadow" ? "🔒 Shadow" : "👤 Real"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.ip_address || "-"}
                            </TableCell>
                            <TableCell className="text-xs">{formatDate(log.created_at)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Sayfalandırma */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Sayfa {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={page >= totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Selection Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kullanıcı Seç</DialogTitle>
            <DialogDescription>Günlükleri filtrelemek için bir kullanıcı seçin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Clear Filter */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleFilterChange({ ...filters, user_id: "" });
                setUserModalOpen(false);
              }}
            >
              Tüm Kullanıcılar
            </Button>

            {/* Creators Section */}
            {userOptions.filter((u) => u.is_creator).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Yaratıcılar</h3>
                <div className="space-y-2">
                  {userOptions
                    .filter((u) => u.is_creator)
                    .map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.user_id === option.value ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => {
                          handleFilterChange({ ...filters, user_id: option.value });
                          setUserModalOpen(false);
                        }}
                      >
                        {option.username} 👑 ({option.role})
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Users Section */}
            {userOptions.filter((u) => !u.is_creator).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Kullanıcılar</h3>
                <div className="space-y-2">
                  {userOptions
                    .filter((u) => !u.is_creator)
                    .map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.user_id === option.value ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => {
                          handleFilterChange({ ...filters, user_id: option.value });
                          setUserModalOpen(false);
                        }}
                      >
                        {option.username} ({option.role})
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
