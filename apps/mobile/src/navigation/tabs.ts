import type { BottomNavigationItem } from "@/components/navigation/BottomNavigation";

export type AppTab = BottomNavigationItem & { route: string };

export const appTabs: AppTab[] = [
  { key: "overview", label: "Panel", detail: "Genel", icon: "layout", route: "/(feed)" },
  { key: "home", label: "Home", detail: "Eski", icon: "home", route: "/home" },
  { key: "live", label: "Canlı", detail: "Rooms", icon: "radio", route: "/(live)" },
  { key: "flow", label: "Akış", detail: "Clips", icon: "layers", route: "/flow" },
  { key: "shadow", label: "Shadow", detail: "Gizli", icon: "eye-off", route: "/(feed)/shadow" },
  { key: "profile", label: "Profil", detail: "Siz", icon: "user", route: "/(profile)" }
];
