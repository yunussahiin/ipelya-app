import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/ops/login");
  }

  // Admin profili kontrolü
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("id, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  // Admin profili yoksa veya pasif ise erişim engelle
  if (!adminProfile || !adminProfile.is_active) {
    await supabase.auth.signOut();
    redirect("/ops/login");
  }

  // Kullanıcı bilgilerini hazırla
  const user = {
    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Admin",
    email: session.user.email || "",
    avatar: session.user.user_metadata?.avatar_url,
    id: session.user.id,
    last_sign_in_at: session.user.last_sign_in_at
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)"
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}
