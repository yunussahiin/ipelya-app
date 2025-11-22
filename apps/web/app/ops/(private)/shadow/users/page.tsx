"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, Info } from "lucide-react";
import { UserLockoutDialog } from "@/components/ops/user-lockout-dialog";
import { UserUnlockDialog } from "@/components/ops/user-unlock-dialog";
import { RateLimitConfigDialog } from "@/components/ops/rate-limit-config-dialog";
import { AnomalyConfigDialog } from "@/components/ops/anomaly-config-dialog";

interface User {
  id: string;
  user_id: string;
  shadow_username?: string;
  shadow_email?: string;
  normal_username?: string;
  normal_email?: string;
  type: string;
  is_creator: boolean;
  is_locked: boolean;
  lock_reason?: string;
  locked_at?: string;
  shadow_created_at?: string;
  last_activity?: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [lockoutDialog, setLockoutDialog] = useState<{
    open: boolean;
    userId?: string;
  }>({ open: false });
  const [unlockDialog, setUnlockDialog] = useState<{
    open: boolean;
    userId?: string;
  }>({ open: false });
  const [rateLimitDialog, setRateLimitDialog] = useState<{
    open: boolean;
    userId?: string;
  }>({ open: false });
  const [anomalyDialog, setAnomalyDialog] = useState<{
    open: boolean;
    userId?: string;
  }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["shadow-users", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await fetch(`/api/ops/shadow/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  const handleLockClick = (user: User) => {
    setLockoutDialog({ open: true, userId: user.user_id });
  };

  const handleUnlockClick = (user: User) => {
    setUnlockDialog({ open: true, userId: user.user_id });
  };

  const handleConfigClick = (user: User, type: "rate-limit" | "anomaly") => {
    if (type === "rate-limit") {
      setRateLimitDialog({ open: true, userId: user.user_id });
    } else {
      setAnomalyDialog({ open: true, userId: user.user_id });
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["shadow-users"] });
  };

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground mt-2">
          Shadow mod kullanıcılarını yönetin ve kilitleyebilirsiniz
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
          <CardDescription>Shadow mod kullanıcılarının listesi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Kullanıcı adı veya email ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <p className="text-muted-foreground">Yükleniyor...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">Kullanıcı bulunamadı</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı Adı</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Son Aktivite</TableHead>
                    <TableHead className="w-12">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">
                        {user.shadow_username || user.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm">{user.normal_email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_locked ? "destructive" : "default"}>
                          {user.is_locked ? "Kilitli" : "Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.last_activity
                          ? new Date(user.last_activity).toLocaleString("tr-TR")
                          : "-"}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                          <Info className="w-4 h-4 mr-1" />
                          Detaylar
                        </Button>
                        {!user.is_locked && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleLockClick(user)}
                          >
                            <Lock className="w-4 h-4 mr-1" />
                            Kilitle
                          </Button>
                        )}
                        {user.is_locked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlockClick(user)}
                          >
                            Aç
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detaylar Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Detayları</DialogTitle>
            <DialogDescription>Shadow profil ve normal hesap bilgileri</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Shadow Profil Bilgileri */}
              <div className="space-y-3 border-b pb-4">
                <h3 className="font-semibold text-sm">Shadow Profil</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Shadow ID</p>
                    <p className="font-mono text-xs break-all">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shadow Kullanıcı Adı</p>
                    <p>{selectedUser.shadow_username || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Durum</p>
                    <Badge variant={selectedUser.is_locked ? "destructive" : "default"}>
                      {selectedUser.is_locked ? "Kilitli" : "Aktif"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creator</p>
                    <p>{selectedUser.is_creator ? "Evet" : "Hayır"}</p>
                  </div>
                </div>
              </div>

              {/* Normal Hesap Bilgileri */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Normal Hesap</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Kullanıcı Adı</p>
                    <p>{selectedUser.normal_username || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="break-all">{selectedUser.normal_email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Son Aktivite</p>
                    <p>
                      {selectedUser.last_activity
                        ? new Date(selectedUser.last_activity).toLocaleString("tr-TR")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kilitleme Bilgileri */}
              {selectedUser.is_locked && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-sm">Kilitleme Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Neden</p>
                      <p>{selectedUser.lock_reason || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kilitli Olana Kadar</p>
                      <p>
                        {selectedUser.locked_at
                          ? new Date(selectedUser.locked_at).toLocaleString("tr-TR")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!selectedUser.is_locked && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleLockClick(selectedUser);
                      setSelectedUser(null);
                    }}
                    className="flex-1"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Kullanıcıyı Kilitle
                  </Button>
                )}
                {selectedUser.is_locked && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUnlockClick(selectedUser);
                      setSelectedUser(null);
                    }}
                    className="flex-1"
                  >
                    Kilit Aç
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    handleConfigClick(selectedUser, "rate-limit");
                    setSelectedUser(null);
                  }}
                  className="flex-1"
                >
                  Oran Limiti
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleConfigClick(selectedUser, "anomaly");
                    setSelectedUser(null);
                  }}
                  className="flex-1"
                >
                  Anomali
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      {lockoutDialog.userId && (
        <UserLockoutDialog
          open={lockoutDialog.open}
          onOpenChange={(open) => setLockoutDialog({ ...lockoutDialog, open })}
          userId={lockoutDialog.userId}
          onSuccess={handleSuccess}
        />
      )}

      {unlockDialog.userId && (
        <UserUnlockDialog
          open={unlockDialog.open}
          onOpenChange={(open) => setUnlockDialog({ ...unlockDialog, open })}
          userId={unlockDialog.userId}
          onSuccess={handleSuccess}
        />
      )}

      {rateLimitDialog.userId && (
        <RateLimitConfigDialog
          open={rateLimitDialog.open}
          onOpenChange={(open) => setRateLimitDialog({ ...rateLimitDialog, open })}
          userId={rateLimitDialog.userId}
          onSuccess={handleSuccess}
        />
      )}

      {anomalyDialog.userId && (
        <AnomalyConfigDialog
          open={anomalyDialog.open}
          onOpenChange={(open) => setAnomalyDialog({ ...anomalyDialog, open })}
          userId={anomalyDialog.userId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
