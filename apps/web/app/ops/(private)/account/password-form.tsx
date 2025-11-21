"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const currentPassword = formData.get("current_password") as string;
      const newPassword = formData.get("new_password") as string;
      const confirmPassword = formData.get("confirm_password") as string;

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("Tüm alanları doldurunuz.");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Yeni şifreler eşleşmiyor.");
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        toast.error("Şifre en az 8 karakter olmalıdır.");
        setIsLoading(false);
        return;
      }

      const supabase = createBrowserSupabaseClient();

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(`Hata: ${error.message}`);
        setIsLoading(false);
        return;
      }

      toast.success("✓ Şifreniz başarıyla güncellendi!");
      e.currentTarget.reset();
    } catch (error) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="current_password">Mevcut Şifre</Label>
        <div className="relative">
          <Input
            id="current_password"
            name="current_password"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Mevcut şifrenizi girin"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showCurrentPassword ? (
              <IconEyeOff className="h-4 w-4" />
            ) : (
              <IconEye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new_password">Yeni Şifre</Label>
        <div className="relative">
          <Input
            id="new_password"
            name="new_password"
            type={showNewPassword ? "text" : "password"}
            placeholder="Yeni şifrenizi girin"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNewPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          En az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam içermelidir.
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Yeni şifrenizi tekrar girin"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <IconEyeOff className="h-4 w-4" />
            ) : (
              <IconEye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
