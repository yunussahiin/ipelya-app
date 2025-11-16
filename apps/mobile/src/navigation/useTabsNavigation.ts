import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { appTabs } from "./tabs";

export function useTabsNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const activeKey = useMemo(() => {
    const match = appTabs.find((tab) => tab.route === pathname);
    return match?.key ?? "overview";
  }, [pathname]);

  const onChange = useCallback(
    (key: string) => {
      const target = appTabs.find((tab) => tab.key === key);
      if (!target) return;
      if (!target.route) {
        Alert.alert("Yakında", "Bu sekme yakında aktif olacak.");
        return;
      }
      if (target.route === pathname) return;
      router.replace(target.route);
    },
    [pathname, router]
  );

  return { tabs: appTabs, activeKey, onChange };
}
