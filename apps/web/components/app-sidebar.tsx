"use client";

import * as React from "react";
import {
  IconCamera,
  IconCoin,
  IconDashboard,
  IconFileAi,
  IconFileText,
  IconHelp,
  IconInnerShadowTop,
  IconReport,
  IconSettings,
  IconShield,
  IconUsers,
  IconBell,
  IconMask,
  IconNews
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Ana Sayfa",
      url: "/ops",
      icon: IconDashboard
    },
    {
      title: "Kullanıcılar",
      url: "/ops/users",
      icon: IconUsers,
      items: [
        {
          title: "Tüm Kullanıcılar",
          url: "/ops/users"
        },
        {
          title: "Creator'lar",
          url: "/ops/users/creators"
        },
        {
          title: "Yasaklılar",
          url: "/ops/users/banned"
        }
      ]
    },
    {
      title: "Feed",
      url: "/ops/feed",
      icon: IconNews,
      items: [
        {
          title: "Genel Bakış",
          url: "/ops/feed"
        },
        {
          title: "Feed Viewer",
          url: "/ops/feed/viewer"
        },
        {
          title: "Algoritma",
          url: "/ops/feed/algorithm"
        },
        {
          title: "Moderasyon",
          url: "/ops/feed/moderation"
        },
        {
          title: "Moderasyon Logları",
          url: "/ops/feed/moderation/logs"
        },
        {
          title: "Analytics",
          url: "/ops/feed/analytics"
        }
      ]
    },
    {
      title: "İçerik",
      url: "/ops/content",
      icon: IconFileText,
      items: [
        {
          title: "Tüm İçerikler",
          url: "/ops/content"
        },
        {
          title: "Onay Bekleyenler",
          url: "/ops/content/pending"
        },
        {
          title: "Raporlananlar",
          url: "/ops/content/reported"
        }
      ]
    },
    {
      title: "Güvenlik",
      url: "/ops/security",
      icon: IconShield,
      items: [
        {
          title: "Güvenlik Sistemi",
          url: "/ops/security"
        },
        {
          title: "Screenshot Logları",
          url: "/ops/security/screenshots"
        },
        {
          title: "Firewall",
          url: "/ops/security/firewall"
        },
        {
          title: "Fraud Detection",
          url: "/ops/security/fraud"
        }
      ]
    },
    {
      title: "Ekonomi",
      url: "/ops/economy",
      icon: IconCoin,
      items: [
        {
          title: "İşlemler",
          url: "/ops/economy/transactions"
        },
        {
          title: "Ödemeler",
          url: "/ops/economy/payouts"
        },
        {
          title: "Raporlar",
          url: "/ops/economy/reports"
        }
      ]
    },
    {
      title: "Bildirimler",
      url: "/ops/notifications",
      icon: IconBell,
      items: [
        {
          title: "Gönder",
          url: "/ops/notifications/send"
        },
        {
          title: "Geçmiş",
          url: "/ops/notifications/history"
        },
        {
          title: "Şablonlar",
          url: "/ops/notifications/templates"
        },
        {
          title: "Analytics",
          url: "/ops/notifications/analytics"
        },
        {
          title: "Temizlik",
          url: "/ops/notifications/cleanup"
        }
      ]
    },
    {
      title: "Shadow Profil",
      url: "/ops/shadow",
      icon: IconMask,
      items: [
        {
          title: "Kontrol Paneli",
          url: "/ops/shadow"
        },
        {
          title: "Oturumlar",
          url: "/ops/shadow/sessions"
        },
        {
          title: "Denetim Günlükleri",
          url: "/ops/shadow/audit-logs"
        },
        {
          title: "Anomaliler",
          url: "/ops/shadow/anomalies"
        },
        {
          title: "Hız Sınırlaması",
          url: "/ops/shadow/rate-limits"
        },
        {
          title: "Analitikler",
          url: "/ops/shadow/analytics"
        },
        {
          title: "Yapılandırma",
          url: "/ops/shadow/config"
        },
        {
          title: "Shadow Kullanıcılar",
          url: "/ops/shadow/users"
        }
      ]
    }
  ],
  navSecondary: [
    {
      title: "DMCA",
      url: "/ops/dmca",
      icon: IconReport,
      items: [
        {
          title: "Taramalar",
          url: "/ops/dmca/scans"
        },
        {
          title: "Raporlar",
          url: "/ops/dmca/reports"
        },
        {
          title: "Aksiyonlar",
          url: "/ops/dmca/actions"
        }
      ]
    },
    {
      title: "Canlı Oturumlar",
      url: "/ops/live",
      icon: IconCamera
    },
    {
      title: "AI Motoru",
      url: "/ops/ai",
      icon: IconFileAi
    }
  ],
  navSettings: [
    {
      name: "Ayarlar",
      url: "/ops/settings",
      icon: IconSettings
    },
    {
      name: "Yardım",
      url: "/ops/help",
      icon: IconHelp
    }
  ]
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">İpelya</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        <NavDocuments items={data.navSettings} />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
