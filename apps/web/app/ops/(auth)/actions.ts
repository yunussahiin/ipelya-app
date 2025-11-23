"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createAdminSupabaseClient,
  createServerSupabaseClient
} from "@/lib/supabase/server";
import type { AuthFormState } from "./types";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Ad-soyad en az 2 karakter olmalı"),
});

function firstErrorMessage(issue: z.ZodIssue[]) {
  return issue.at(0)?.message ?? "Lütfen formu kontrol et";
}

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstErrorMessage(parsed.error.issues) };
  }

  const supabase = await createServerSupabaseClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: error.message };
  }

  // Role kontrolü - profiles tablosundan
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, type")
    .eq("user_id", authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { status: "error", message: "Profil bulunamadı. Lütfen tekrar kayıt olun." };
  }

  // Sadece admin rolüne sahip kullanıcılar giriş yapabilir
  if (profile.role !== "admin") {
    await supabase.auth.signOut();
    return { status: "error", message: "Bu alana sadece yöneticiler erişebilir." };
  }

  // Hesap yasaklı mı kontrol et
  if (profile.type === "banned") {
    await supabase.auth.signOut();
    return { status: "error", message: "Hesabınız yasaklanmış durumda." };
  }

  // Admin metadata kontrolü (opsiyonel - aktiflik durumu için)
  const { data: adminMeta } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("id", authData.user.id)
    .single();

  if (adminMeta && !adminMeta.is_active) {
    await supabase.auth.signOut();
    return { status: "error", message: "Admin hesabınız pasif durumda." };
  }

  redirect("/ops");
}

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: firstErrorMessage(parsed.error.issues) };
  }

  const supabase = createAdminSupabaseClient();
  
  // Yeni kullanıcı kaydı
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    user_metadata: {
      full_name: parsed.data.name,
      role: "admin"
    },
    email_confirm: true // Email confirmation'ı bypass et
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  // Trigger'ın profile oluşturmasını bekle (fallback: manuel oluştur)
  if (authData?.user?.id) {
    const userId = authData.user.id;
    
    // Trigger'ın çalışmasını bekle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Profile'ın oluşturulduğunu kontrol et
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "real")
      .single();

    // Profile yoksa manuel oluştur
    if (!profile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          username: parsed.data.email.split("@")[0],
          email: parsed.data.email,
          type: "real",
          role: "admin",
          is_active: true
        });

      if (profileError) {
        console.error("Profile oluşturma hatası:", profileError);
      }
    }

    // Admin profile'ı kontrol et ve oluştur
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!adminProfile) {
      const { error: adminError } = await supabase
        .from("admin_profiles")
        .insert({
          id: userId,
          email: parsed.data.email,
          full_name: parsed.data.name,
          is_active: true
        });

      if (adminError) {
        console.error("Admin profile oluşturma hatası:", adminError);
      }
    }
  }

  // Email confirmation kapalı ise otomatik giriş yap
  if (authData?.user) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (!signInError) {
      redirect("/ops");
    }
  }

  // Fallback: Login sayfasına yönlendir
  redirect("/ops/login");
}
