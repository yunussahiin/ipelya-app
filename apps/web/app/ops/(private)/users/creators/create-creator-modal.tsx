"use client";

import { useState } from "react";
import { IconMail, IconPhone, IconUser, IconLock } from "@tabler/icons-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface CreateCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatorCreated?: () => void;
}

export function CreateCreatorModal({
  open,
  onOpenChange,
  onCreatorCreated
}: CreateCreatorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    phone: "",
    bio: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
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
          is_creator: true,
          role: "creator",
          type: "active"
        })
        .eq("user_id", authData.user.id);

      if (profileError) {
        console.error("Profile error:", profileError);
        toast.error(`Profile güncelleme hatası: ${profileError.message || "Bilinmeyen hata"}`);
        setIsLoading(false);
        return;
      }

      toast.success("Creator başarıyla oluşturuldu!");
      setFormData({
        email: "",
        password: "",
        full_name: "",
        username: "",
        phone: "",
        bio: ""
      });
      onOpenChange(false);
      onCreatorCreated?.();
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
          <DialogTitle>Yeni Creator Oluştur</DialogTitle>
          <DialogDescription>Yeni bir creator hesabı oluşturun ve yönetin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Hesap</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
            </TabsList>

            {/* Hesap Tab */}
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <IconMail className="h-4 w-4" />
                  E-posta
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="creator@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <IconLock className="h-4 w-4" />
                  Şifre
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
                  placeholder="Creator Adı"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="creator_username"
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
            </TabsContent>

            {/* Profil Tab */}
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Biyografi</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Creator hakkında bilgi..."
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={5}
                />
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-3">Creator Rolü</p>
                <div className="space-y-2">
                  <Badge variant="default" className="bg-blue-500">
                    Creator Hesabı
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Bu hesap creator rolü ile oluşturulacak ve içerik yayınlayabilecektir.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Oluşturuluyor..." : "Creator Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
