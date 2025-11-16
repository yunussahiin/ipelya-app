import { Appearance, ColorSchemeName } from "react-native";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type ThemeScheme = "light" | "dark";

export type ThemeAccent = "magenta" | "aqua" | "amber";

export type ThemeColors = {
  background: string;
  backgroundRaised: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  highlight: string;
  success: string;
  warning: string;
  heroOverlay: string;
  glowShadow: string;
  navIndicator: string;
  navIndicatorAndroid: string;
  navShadow: string;
  navBlurTint: "light" | "dark";
  navBorder: string;
  navBackground: string;
  buttonPrimaryText: string;
};

type ThemeContextValue = {
  scheme: ThemeScheme;
  colors: ThemeColors;
  accent: ThemeAccent;
  toggleScheme: () => void;
  setScheme: (scheme: ThemeScheme) => void;
  setAccent: (accent: ThemeAccent) => void;
};

const palettes: Record<ThemeScheme, ThemeColors> = {
  dark: {
    background: "#050505",
    backgroundRaised: "#0a0a0a",
    surface: "#0f0f12",
    surfaceAlt: "#111111",
    border: "#1f1f20",
    borderMuted: "#262626",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    textMuted: "#6b7280",
    accent: "#ff3b81",
    accentSoft: "#ff63c0",
    highlight: "#a78bfa",
    success: "#22c55e",
    warning: "#fbbf24",
    heroOverlay: "rgba(5,5,5,0.55)",
    glowShadow: "#000000",
    navIndicator: "#ff63c0",
    navIndicatorAndroid: "#ff3b81",
    navShadow: "rgba(0,0,0,0.45)",
    navBlurTint: "dark",
    navBorder: "rgba(255,255,255,0.05)",
    navBackground: "rgba(14,14,16,0.9)",
    buttonPrimaryText: "#ffffff"
  },
  light: {
    background: "#f8f8fb",
    backgroundRaised: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#f4f4f5",
    border: "#e4e4e7",
    borderMuted: "#d4d4d8",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent: "#d946ef",
    accentSoft: "#f472b6",
    highlight: "#7c3aed",
    success: "#16a34a",
    warning: "#d97706",
    heroOverlay: "rgba(255,255,255,0.78)",
    glowShadow: "#94a3b8",
    navIndicator: "#db2777",
    navIndicatorAndroid: "#be185d",
    navShadow: "rgba(15,23,42,0.15)",
    navBlurTint: "light",
    navBorder: "rgba(15,23,42,0.08)",
    navBackground: "rgba(255,255,255,0.88)",
    buttonPrimaryText: "#ffffff"
  }
};

type AccentPalette = {
  [K in ThemeScheme]: Pick<ThemeColors, "accent" | "accentSoft" | "navIndicator" | "navIndicatorAndroid">;
};

const accentPalettes: Record<ThemeAccent, AccentPalette> = {
  magenta: {
    dark: {
      accent: "#ff3b81",
      accentSoft: "#ff63c0",
      navIndicator: "#ff63c0",
      navIndicatorAndroid: "#ff3b81"
    },
    light: {
      accent: "#d946ef",
      accentSoft: "#f472b6",
      navIndicator: "#db2777",
      navIndicatorAndroid: "#be185d"
    }
  },
  aqua: {
    dark: {
      accent: "#22d3ee",
      accentSoft: "#67e8f9",
      navIndicator: "#5eead4",
      navIndicatorAndroid: "#0ea5e9"
    },
    light: {
      accent: "#0ea5e9",
      accentSoft: "#38bdf8",
      navIndicator: "#0891b2",
      navIndicatorAndroid: "#0ea5e9"
    }
  },
  amber: {
    dark: {
      accent: "#fbbf24",
      accentSoft: "#facc15",
      navIndicator: "#f59e0b",
      navIndicatorAndroid: "#d97706"
    },
    light: {
      accent: "#f97316",
      accentSoft: "#f59e0b",
      navIndicator: "#ea580c",
      navIndicatorAndroid: "#c2410c"
    }
  }
};

const ThemeContext = createContext<ThemeContextValue>({
  scheme: "dark",
  colors: palettes.dark,
  accent: "magenta",
  toggleScheme: () => {},
  setScheme: () => {},
  setAccent: () => {}
});

function resolveScheme(value: ColorSchemeName | ThemeScheme | null | undefined): ThemeScheme {
  return value === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ThemeScheme>(() => resolveScheme(Appearance.getColorScheme()));
  const [accent, setAccentState] = useState<ThemeAccent>("magenta");

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSchemeState(resolveScheme(colorScheme));
    });
    return () => subscription.remove();
  }, []);

  const setScheme = (next: ThemeScheme) => setSchemeState(next);
  const toggleScheme = () => setSchemeState((prev) => (prev === "dark" ? "light" : "dark"));
  const setAccent = (next: ThemeAccent) => setAccentState(next);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = resolveScheme(scheme);
    const accentPalette = accentPalettes[accent][resolved];
    const baseColors = palettes[resolved];
    return {
      scheme: resolved,
      colors: {
        ...baseColors,
        accent: accentPalette.accent,
        accentSoft: accentPalette.accentSoft,
        navIndicator: accentPalette.navIndicator,
        navIndicatorAndroid: accentPalette.navIndicatorAndroid
      },
      accent,
      toggleScheme,
      setScheme,
      setAccent
    };
  }, [scheme, accent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
