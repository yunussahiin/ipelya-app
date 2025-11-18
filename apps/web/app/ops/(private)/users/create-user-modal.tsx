"use client";

import { useState } from "react";
import { IconMail, IconPhone, IconUser, IconLock, IconShield } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

export function CreateUserModal({ open, onOpenChange, onUserCreated }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    phone: "",
    bio: "",
    role: "user" // "user" | "creator" | "admin"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (role: "user" | "creator" | "admin") => {
    setFormData((prev) => ({
      ...prev,
      role
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      // Validasyon
      if (!formData.email || !formData.password) {
        toast.error("E-posta ve şifre gereklidir.");
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error("Şifre en az 6 karakter olmalıdır.");
        setIsLoading(false);
        return;
      }

      // Auth kullanıcısı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      });

      if (authError) {
        toast.error(`Hata: ${authError.message}`);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Kullanıcı oluşturulamadı.");
        setIsLoading(false);
        return;
      }

      // Profile'ı güncelle (auth trigger zaten oluşturdu)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: formData.username || formData.email.split("@")[0],
          display_name: formData.full_name,
          bio: formData.bio || null,
          phone: formData.phone || null,
          is_creator: formData.role === "creator",
          role: formData.role
        })
        .eq("user_id", authData.user.id);

      if (profileError) {
        console.error("Profile error:", profileError);
        toast.error(`Profile güncelleme hatası: ${profileError.message || "Bilinmeyen hata"}`);
        setIsLoading(false);
        return;
      }

      // Admin ise admin_profiles'e ekle
      if (formData.role === "admin") {
        const { error: adminError } = await supabase.from("admin_profiles").insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            is_active: true
          }
        ]);

        if (adminError) {
          toast.error(`Admin profili oluşturma hatası: ${adminError.message}`);
          setIsLoading(false);
          return;
        }
      }

      toast.success("Kullanıcı başarıyla oluşturuldu!");
      setFormData({
        email: "",
        password: "",
        full_name: "",
        username: "",
        phone: "",
        bio: "",
        role: "user"
      });
      onOpenChange(false);
      onUserCreated?.();
    } catch (error) {
      console.error("Catch error:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast.error(`Hata: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir kullanıcı hesabı oluşturun ve temel bilgilerini ayarlayın
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="permissions">İzinler</TabsTrigger>
            </TabsList>

            {/* Temel Bilgiler */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <IconMail className="h-4 w-4" />
                    E-posta *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <IconLock className="h-4 w-4" />
                    Şifre *
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    Ad Soyad
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Adı Soyadı"
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="kullaniciadi"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+90 5XX XXX XX XX"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Profil */}
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Biyografi</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Kullanıcı hakkında bilgi..."
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={5}
                />
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-4">Kullanıcı Rolü</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="role_user"
                      name="role"
                      value="user"
                      checked={formData.role === "user"}
                      onChange={() => handleRoleChange("user")}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="role_user" className="font-normal cursor-pointer">
                      Normal Kullanıcı
                    </Label>
                    <Badge variant="outline" className="ml-auto">
                      Standart
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="role_creator"
                      name="role"
                      value="creator"
                      checked={formData.role === "creator"}
                      onChange={() => handleRoleChange("creator")}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="role_creator" className="font-normal cursor-pointer">
                      Creator Hesabı
                    </Label>
                    <Badge variant="outline" className="ml-auto">
                      İçerik Üreticisi
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="role_admin"
                      name="role"
                      value="admin"
                      checked={formData.role === "admin"}
                      onChange={() => handleRoleChange("admin")}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="role_admin"
                      className="font-normal cursor-pointer flex items-center gap-2"
                    >
                      <IconShield className="h-4 w-4" />
                      Admin Hesabı
                    </Label>
                    <Badge variant="default" className="bg-purple-500 ml-auto">
                      Yönetici
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Admin hesapları Ops Panel&apos;e erişim sağlar ve kullanıcıları yönetebilir.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  💡 İpucu: Kullanıcı oluşturulduktan sonra profil ayarlarından daha fazla bilgi
                  ekleyebilirsiniz.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
