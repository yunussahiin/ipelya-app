import { useColorScheme } from "react-native";

export function useDeviceTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? "dark" : "light";
}
