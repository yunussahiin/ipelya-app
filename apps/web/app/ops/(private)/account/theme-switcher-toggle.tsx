"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

const applyTheme = (newTheme: Theme) => {
  const root = document.documentElement;

  if (newTheme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  } else {
    root.classList.toggle("dark", newTheme === "dark");
  }
};

export function ThemeSwitcherToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const theme = savedTheme || "system";

    if (theme === "system") {
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(isDarkMode);
    } else {
      setIsDark(theme === "dark");
    }
  }, []);

  const handleToggle = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    const newTheme: Theme = newIsDark ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9"
      title={isDark ? "Açık moda geç" : "Koyu moda geç"}
    >
      {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
    </Button>
  );
}
