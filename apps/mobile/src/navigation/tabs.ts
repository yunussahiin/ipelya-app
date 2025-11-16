import type { BottomNavigationItem } from "@/components/navigation/BottomNavigation";

export type AppTab = BottomNavigationItem & { route: string };

export const appTabs: AppTab[] = [
  { key: "overview", label: "Panel", detail: "Genel", icon: "layout", route: "/" },
  { key: "live", label: "Canlı", detail: "Rooms", icon: "radio", route: "/live" },
  { key: "flow", label: "Akış", detail: "Clips", icon: "layers", route: "/flow" },
  { key: "profile", label: "Profil", detail: "Siz", icon: "user", route: "/profile" }
];
