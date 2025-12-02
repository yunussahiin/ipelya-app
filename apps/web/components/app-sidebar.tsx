"use client";

import * as React from "react";
import {
  IconCamera,
  IconCoin,
  IconCrown,
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
  IconNews,
  IconServer,
  IconMessage
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
          url: "/ops/feed/algorithm",
          items: [
            {
              title: "Weights",
              url: "/ops/feed/algorithm/weights"
            },
            {
              title: "Vibe Matrix",
              url: "/ops/feed/algorithm/vibe"
            },
            {
              title: "Intent Matrix",
              url: "/ops/feed/algorithm/intent"
            },
            {
              title: "Diversity",
              url: "/ops/feed/algorithm/diversity"
            }
          ]
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
          title: "Moderasyon Kuyruğu",
          url: "/ops/feed/moderation/queue"
        },
        {
          title: "Analytics",
          url: "/ops/feed/analytics"
        },
        {
          title: "A/B Testing",
          url: "/ops/feed/experiments"
        },
        {
          title: "Canlı İstatistikler",
          url: "/ops/feed/live"
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
      title: "Tier Yönetimi",
      url: "/ops/tier-management",
      icon: IconCrown,
      items: [
        {
          title: "Genel Bakış",
          url: "/ops/tier-management"
        },
        {
          title: "Avantajlar",
          url: "/ops/tier-management/benefits"
        },
        {
          title: "Şablonlar",
          url: "/ops/tier-management/templates"
        }
      ]
    },
    {
      title: "Mesajlaşma",
      url: "/ops/messaging",
      icon: IconMessage,
      items: [
        {
          title: "Genel Bakış",
          url: "/ops/messaging"
        },
        {
          title: "DM Sohbetleri",
          url: "/ops/messaging/conversations"
        },
        {
          title: "Broadcast Kanalları",
          url: "/ops/messaging/broadcast"
        },
        {
          title: "Admin Chat",
          url: "/ops/admin-chat"
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
    },
    {
      title: "Sistem",
      url: "/ops/system",
      icon: IconServer,
      items: [
        {
          title: "Observability",
          url: "/ops/system/observability"
        },
        {
          title: "Cron Jobs",
          url: "/ops/system/cron"
        },
        {
          title: "Storage",
          url: "/ops/storage"
        },
        {
          title: "Storage Analytics",
          url: "/ops/storage/analytics"
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
