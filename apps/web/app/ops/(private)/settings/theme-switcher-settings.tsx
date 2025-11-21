"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun, IconBrush } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";

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

export function ThemeSwitcherSettings() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Tema Seçimi</Label>
        <p className="text-sm text-muted-foreground">Tercih ettiğiniz tema modunu seçin</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Light Theme */}
        <button
          onClick={() => handleThemeChange("light")}
          className={`relative rounded-lg border-2 p-4 transition-all ${
            theme === "light"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="mb-3 flex justify-center">
            <IconSun className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
          </div>
          <p className="text-center text-sm font-medium">Açık</p>
          <p className="text-center text-xs text-muted-foreground">Light Mode</p>
        </button>

        {/* Dark Theme */}
        <button
          onClick={() => handleThemeChange("dark")}
          className={`relative rounded-lg border-2 p-4 transition-all ${
            theme === "dark"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="mb-3 flex justify-center">
            <IconMoon className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          </div>
          <p className="text-center text-sm font-medium">Koyu</p>
          <p className="text-center text-xs text-muted-foreground">Dark Mode</p>
        </button>

        {/* System Theme */}
        <button
          onClick={() => handleThemeChange("system")}
          className={`relative rounded-lg border-2 p-4 transition-all ${
            theme === "system"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="mb-3 flex justify-center">
            <IconBrush className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-center text-sm font-medium">Sistem</p>
          <p className="text-center text-xs text-muted-foreground">System Default</p>
        </button>
      </div>
    </div>
  );
}
