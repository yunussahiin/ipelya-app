"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcherToggle } from "@/app/ops/(private)/account/theme-switcher-toggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { NavUser } from "@/components/nav-user";
import { AdminChatButton } from "@/components/ops/admin-chat/AdminChatButton";

interface SiteHeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Sayfa yollarından başlık oluştur
function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return "Dashboard";

  // Dinamik segmentleri kaldır (örn: [userId])
  const cleanSegments = segments.filter((s) => !s.startsWith("[") && !s.endsWith("]"));

  // Son segment'i başlık olarak kullan
  const lastSegment = cleanSegments[cleanSegments.length - 1];

  const titleMap: Record<string, string> = {
    "admin-chat": "Admin Chat",
    ai: "AI Assistant",
    users: "Users",
    sessions: "Sessions",
    anomalies: "Anomalies",
    account: "Account",
    settings: "Settings",
    messaging: "Messaging",
    broadcast: "Broadcast",
    analytics: "Analytics",
    dashboard: "Dashboard",
    ops: "Dashboard"
  };

  return (
    titleMap[lastSegment] ||
    lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
  );
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="hidden md:block text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <AdminChatButton />
          <NotificationCenter notifications={[]} />
          <ThemeSwitcherToggle />
          {user && <NavUser user={user} variant="header" />}
        </div>
      </div>
    </header>
  );
}
