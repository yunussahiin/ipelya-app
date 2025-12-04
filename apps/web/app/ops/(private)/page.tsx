import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminProfileCard } from "./admin-profile-card";

import data from "../data.json";

export default async function Page() {
  const supabase = await createServerSupabaseClient();

  // getUser() kullan - getSession() güvenli değil
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // User yoksa boş değerler döndür
  let profile = null;
  let adminMeta = null;

  if (user?.id) {
    // Kullanıcı profil bilgilerini çek (role-based)
    // type='real' filtresi ekle - shadow profil varsa 406 hatası alınır
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "real")
      .single();
    profile = profileData;

    // Admin metadata'sını çek (opsiyonel)
    const { data: adminData } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    adminMeta = adminData;
  }

  return (
    <>
      {/* Kullanıcı Bilgileri Kartı */}
      <AdminProfileCard user={user} profile={profile} adminMeta={adminMeta} />

      <SectionCards />
      <div>
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
