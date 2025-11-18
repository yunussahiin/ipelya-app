import type { BottomNavigationItem } from "@/components/navigation/BottomNavigation";

export type AppTab = BottomNavigationItem & { route: string };

export const appTabs: AppTab[] = [
  { key: "overview", label: "Panel", detail: "Genel", icon: "layout", route: "/home" },
  { key: "live", label: "Canlı", detail: "Rooms", icon: "radio", route: "/live" },
  { key: "flow", label: "Akış", detail: "Clips", icon: "layers", route: "/flow" },
  { key: "chat", label: "Mesajlar", detail: "DM", icon: "message-circle", route: "/(chat)" },
  { key: "profile", label: "Profil", detail: "Siz", icon: "user", route: "/(profile)" }
];
