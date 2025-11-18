"use client";

import { useState } from "react";
import { IconUpload } from "@tabler/icons-react";
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

      toast.success("Profil bilgileriniz güncellendi.");
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
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="text-2xl">
            {user.full_name?.charAt(0) || user.email?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
        <div>
          <Button type="button" variant="outline" size="sm">
            <IconUpload className="mr-2 h-4 w-4" />
            Fotoğraf Yükle
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG veya GIF. Maksimum 2MB.</p>
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
