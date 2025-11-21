"use client";

import { useState, useRef } from "react";
import { IconUpload, IconLoader } from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  phone: string;
}

export function AccountForm({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan fazla olamaz.");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Sadece JPG, PNG, GIF veya WebP dosyaları destekleniyor.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const supabase = createBrowserSupabaseClient();

      // Generate unique filename with user ID prefix
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage with upsert
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        toast.error(`Yükleme başarısız: ${uploadError.message}`);
        setIsUploadingAvatar(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const newAvatarUrl = publicUrlData.publicUrl;

      // Update user metadata with new avatar URL
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: newAvatarUrl
        }
      });

      if (authError) {
        toast.error(`Profil güncellemesi başarısız: ${authError.message}`);
        setIsUploadingAvatar(false);
        return;
      }

      setAvatarUrl(newAvatarUrl);
      toast.success("✓ Profil fotoğrafınız başarıyla güncellendi!");
    } catch (error) {
      toast.error("Fotoğraf yüklenirken hata oluştu.");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const full_name = formData.get("full_name") as string;
      const phone = formData.get("phone") as string;

      const supabase = createBrowserSupabaseClient();

      // Update user metadata in auth.users
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name,
          phone
        }
      });

      if (authError) {
        toast.error(`Hata: ${authError.message}`);
        setIsLoading(false);
        return;
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone
        })
        .eq("user_id", user.id);

      if (profileError) {
        toast.error(`Profil güncellemesi başarısız: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      toast.success("✓ Profil bilgileriniz güncellendi!");
    } catch (error) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-2xl">
            {user.full_name?.charAt(0) || user.email?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploadingAvatar ? (
              <>
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <IconUpload className="mr-2 h-4 w-4" />
                Fotoğraf Yükle
              </>
            )}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, GIF veya WebP. Maksimum 2MB.
          </p>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={user.full_name}
          placeholder="Ad Soyad"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          placeholder="ornek@email.com"
          disabled
        />
        <p className="text-xs text-muted-foreground">
          E-posta adresinizi değiştirmek için destek ekibiyle iletişime geçin.
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={user.phone}
          placeholder="+90 5XX XXX XX XX"
        />
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
      </Button>
    </form>
  );
}
