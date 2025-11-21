"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const MODIFIER_KEYS = ["Ctrl", "Alt", "Shift", "Meta"];
const FUNCTION_KEYS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];

const KEY_SYMBOLS: Record<string, { mac: string; windows: string; description: string }> = {
  Ctrl: { mac: "⌃", windows: "Ctrl", description: "Control tuşu" },
  Alt: { mac: "⌥", windows: "Alt", description: "Alt tuşu" },
  Shift: { mac: "⇧", windows: "Shift", description: "Shift tuşu" },
  Meta: { mac: "⌘", windows: "Win", description: "Command/Windows tuşu" },
  Enter: { mac: "↩", windows: "Enter", description: "Enter tuşu" },
  Space: { mac: "␣", windows: "Space", description: "Boşluk tuşu" }
};

interface ShortcutItem {
  label: string;
  modifier: string;
  key: string;
}

function getKeyDisplay(key: string, isMac: boolean = false) {
  const symbols = KEY_SYMBOLS[key];
  if (symbols) {
    return isMac ? symbols.mac : symbols.windows;
  }
  return key;
}

function KeyDisplay({ modifier, key }: { modifier: string; key: string }) {
  const isMac = typeof window !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className="font-mono text-xs">
        {getKeyDisplay(modifier, isMac)}
      </Badge>
      <span className="text-muted-foreground text-xs">+</span>
      <Badge variant="outline" className="font-mono text-xs">
        {getKeyDisplay(key, isMac)}
      </Badge>
    </div>
  );
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { label: "Gönderi", modifier: "Ctrl", key: "P" },
  { label: "Hikaye", modifier: "Ctrl", key: "S" },
  { label: "Reel", modifier: "Ctrl", key: "R" },
  { label: "Kontrol Paneli", modifier: "Ctrl", key: "1" },
  { label: "Kullanıcılar", modifier: "Ctrl", key: "2" },
  { label: "İçerik", modifier: "Ctrl", key: "3" },
  { label: "Bildirimler", modifier: "Ctrl", key: "4" },
  { label: "Ekonomi", modifier: "Ctrl", key: "5" },
  { label: "Hesap", modifier: "Ctrl", key: "6" },
  { label: "Güvenlik", modifier: "Ctrl", key: "7" },
  { label: "Ayarlar", modifier: "Ctrl", key: "8" },
  { label: "Analitikler", modifier: "Ctrl", key: "9" },
  { label: "Raporlar", modifier: "Ctrl", key: "0" }
];

export function ShortcutsSettings() {
  const [shortcuts, setShortcuts] = React.useState<ShortcutItem[]>(DEFAULT_SHORTCUTS);

  React.useEffect(() => {
    // localStorage'dan yükle
    const saved = localStorage.getItem("appShortcuts");
    if (saved) {
      try {
        setShortcuts(JSON.parse(saved));
      } catch (e) {
        console.error("Kısayollar yüklenemedi:", e);
      }
    }
  }, []);

  const handleModifierChange = (index: number, value: string) => {
    const newShortcuts = [...shortcuts];
    newShortcuts[index].modifier = value;
    setShortcuts(newShortcuts);
  };

  const checkDuplicateShortcuts = (): string[] => {
    const shortcuts_map = new Map<string, string[]>();
    const duplicates: string[] = [];

    shortcuts.forEach((shortcut) => {
      const key = `${shortcut.modifier}+${shortcut.key}`;
      if (shortcuts_map.has(key)) {
        const existing = shortcuts_map.get(key) || [];
        duplicates.push(`${key}: ${existing.join(", ")} ve ${shortcut.label}`);
      } else {
        shortcuts_map.set(key, [shortcut.label]);
      }
    });

    return duplicates;
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const newShortcuts = [...shortcuts];

    // Fonksiyon tuşlarını yakala
    if (e.key.startsWith("F") && /^F\d+$/.test(e.key)) {
      newShortcuts[index].key = e.key;
    }
    // Ctrl, Alt, Shift, Meta tuşlarını yakala
    else if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
      newShortcuts[index].key = "Ctrl";
    } else if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      newShortcuts[index].key = "Alt";
    } else if (e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      newShortcuts[index].key = "Shift";
    } else if (e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      newShortcuts[index].key = "Meta";
    }
    // Normal tuşları yakala
    else if (e.key.length === 1) {
      newShortcuts[index].key = e.key.toUpperCase();
    } else if (e.key === "Enter") {
      newShortcuts[index].key = "Enter";
    } else if (e.key === " ") {
      newShortcuts[index].key = "Space";
    } else if (/^[0-9]$/.test(e.key)) {
      newShortcuts[index].key = e.key;
    }

    setShortcuts(newShortcuts);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kısayol Tuşları</CardTitle>
          <CardDescription>Uygulama kısayollarını özelleştir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Oluştur</h3>
            <div className="space-y-3">
              {shortcuts.slice(0, 3).map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <Label className="text-base">{shortcut.label}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={shortcut.modifier}
                      onChange={(e) => handleModifierChange(idx, e.target.value)}
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono hover:bg-muted cursor-pointer"
                    >
                      {MODIFIER_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {getKeyDisplay(key, false)}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground font-semibold">+</span>
                    <input
                      type="text"
                      value={shortcut.key}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      readOnly
                      className="w-12 px-3 py-2 rounded border border-border bg-muted text-sm text-center font-mono cursor-pointer hover:bg-muted/80 transition-colors"
                      placeholder="Tuş"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Yönetim</h3>
            <div className="space-y-3">
              {shortcuts.slice(3).map((shortcut, idx) => (
                <div
                  key={idx + 3}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <Label className="text-base">{shortcut.label}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={shortcut.modifier}
                      onChange={(e) => handleModifierChange(idx + 3, e.target.value)}
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono hover:bg-muted cursor-pointer"
                    >
                      {MODIFIER_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {getKeyDisplay(key, false)}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground font-semibold">+</span>
                    <input
                      type="text"
                      value={shortcut.key}
                      onKeyDown={(e) => handleKeyDown(idx + 3, e)}
                      readOnly
                      className="w-12 px-3 py-2 rounded border border-border bg-muted text-sm text-center font-mono cursor-pointer hover:bg-muted/80 transition-colors"
                      placeholder="Tuş"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              💡 <strong>İpucu:</strong> Tuş alanına tıkla ve istediğin tuşa bas. Fonksiyon tuşları
              (F1-F12), sayılar, harfler ve modifier tuşları (Ctrl, Alt, Shift, Meta) destekleniyor.
            </p>
          </div>

          <Button
            onClick={() => {
              const duplicates = checkDuplicateShortcuts();

              if (duplicates.length > 0) {
                toast.error("Çakışan Kısayollar!", {
                  description: duplicates.join("\n"),
                  duration: 5000
                });
                return;
              }

              localStorage.setItem("appShortcuts", JSON.stringify(shortcuts));
              toast.success("Kısayollar Kaydedildi!", {
                description: "Değişiklikleri görmek için sayfayı yenileyiniz.",
                duration: 3000
              });
            }}
          >
            Değişiklikleri Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Keyboard Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tuş Simgeleri Rehberi</CardTitle>
          <CardDescription>macOS ve Windows arasındaki tuş farklılıkları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* macOS */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-lg">🍎</span> macOS
              </h3>
              <div className="space-y-2">
                {Object.entries(KEY_SYMBOLS).map(([key, { mac, description }]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{description}</span>
                    <Badge variant="outline" className="font-mono">
                      {mac}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Windows */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-lg">🪟</span> Windows
              </h3>
              <div className="space-y-2">
                {Object.entries(KEY_SYMBOLS).map(([key, { windows, description }]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{description}</span>
                    <Badge variant="outline" className="font-mono">
                      {windows}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-blue-50 dark:bg-blue-950/20 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>ℹ️ Not:</strong> Kısayollar otomatik olarak işletim sisteminize uyarlanır.
              macOS'ta ⌘ (Command) tuşu, Windows'ta Win tuşu olarak gösterilir.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
