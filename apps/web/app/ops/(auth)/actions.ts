"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const supabase = await createServerSupabaseClient();
  
  // Yeni kullanıcı kaydı
  const { data: authData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { 
        full_name: parsed.data.name,
        role: "admin" // Ops register'dan kaydolanlar admin olacak
      },
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  // Kullanıcı oluşturuldu ama email confirmation bekliyor
  if (authData.user && !authData.session) {
    redirect("/ops/login?msg=confirm");
  }

  // Email confirmation kapalıysa direkt giriş yapılır
  if (authData.session) {
    redirect("/ops");
  }

  redirect("/ops/login?msg=confirm");
}
