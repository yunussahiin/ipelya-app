"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconChevronRight, IconMail, type Icon } from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";

type CommandOption = {
  value: string;
  label: string;
  keys: string[];
  path?: string;
  category?: string;
};

const createOptions: CommandOption[] = [
  { value: "post", label: "Gönderi", keys: ["Ctrl", "P"] },
  { value: "story", label: "Hikaye", keys: ["Ctrl", "S"] },
  { value: "reel", label: "Reel", keys: ["Ctrl", "R"] }
];

const opsOptions: CommandOption[] = [
  { value: "dashboard", label: "Kontrol Paneli", keys: ["Ctrl", "1"], path: "/ops" },
  { value: "users", label: "Kullanıcılar", keys: ["Ctrl", "2"], path: "/ops/users" },
  { value: "content", label: "İçerik", keys: ["Ctrl", "3"], path: "/ops/content" },
  { value: "notifications", label: "Bildirimler", keys: ["Ctrl", "4"], path: "/ops/notifications" },
  { value: "economy", label: "Ekonomi", keys: ["Ctrl", "5"], path: "/ops/economy" },
  { value: "account", label: "Hesap", keys: ["Ctrl", "6"], path: "/ops/account" },
  { value: "security", label: "Güvenlik", keys: ["Ctrl", "7"], path: "/ops/security" },
  { value: "settings", label: "Ayarlar", keys: ["Ctrl", "8"], path: "/ops/settings" },
  { value: "analytics", label: "Analitikler", keys: ["Ctrl", "9"], path: "/ops/analytics" },
  { value: "reports", label: "Raporlar", keys: ["Ctrl", "0"], path: "/ops/reports" }
];

const allOptions: CommandOption[] = [
  ...createOptions.map((opt) => ({ ...opt, category: "Create" })),
  ...opsOptions.map((opt) => ({ ...opt, category: "Ops" }))
];

function QuickCreateDialog() {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "create" | "ops">("all");
  const [shortcuts, setShortcuts] = React.useState<CommandOption[]>([
    ...createOptions,
    ...opsOptions
  ]);
  const router = useRouter();

  React.useEffect(() => {
    // localStorage'dan kısayolları yükle
    const saved = localStorage.getItem("appShortcuts");
    if (saved) {
      try {
        const savedShortcuts = JSON.parse(saved) as Array<{
          label: string;
          modifier: string;
          key: string;
        }>;
        // Eşleştir ve güncelle
        const updated = [...createOptions, ...opsOptions].map((opt) => {
          const savedItem = savedShortcuts.find((s) => s.label === opt.label);
          return savedItem ? { ...opt, keys: [savedItem.modifier, savedItem.key] } : opt;
        });
        setShortcuts(updated);
      } catch (e) {
        console.error("Kısayollar yüklenemedi:", e);
      }
    }
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Dialog açma: ⌘K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Kısayollar: Modifier + tuş kombinasyonları
      // Hangi modifier tuşu basıldığını belirle
      let pressedModifier = "";
      if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        pressedModifier = "Ctrl";
      } else if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        pressedModifier = "Alt";
      } else if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        pressedModifier = "Shift";
      } else if (e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        pressedModifier = "Meta";
      }

      // Eğer bir modifier tuşu basıldıysa, eşleşen kısayolu bul
      if (pressedModifier) {
        const matchedOption = shortcuts.find((opt) => {
          const modifier = opt.keys[0];
          const key = opt.keys[opt.keys.length - 1];
          return modifier === pressedModifier && key.toLowerCase() === e.key.toLowerCase();
        });

        if (matchedOption && matchedOption.path) {
          e.preventDefault();
          setOpen(false);
          router.push(matchedOption.path);
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router, shortcuts]);

  const handleSelect = (option: CommandOption) => {
    setOpen(false);
    if (option.path) {
      router.push(option.path);
    }
  };

  const getFilteredOptions = () => {
    if (activeTab === "create") return createOptions;
    if (activeTab === "ops") return opsOptions;
    return allOptions;
  };

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)} className="w-full justify-between">
        <span className="flex-1 text-left">Hızlı Oluştur</span>
        <div className="flex items-center gap-2 ml-2">
          <KbdGroup>
            <Kbd className="text-xs">⌘</Kbd>
            <Kbd className="text-xs">K</Kbd>
          </KbdGroup>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ara..." />
        <div className="flex items-center gap-1 border-b border-border px-4 py-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            Oluştur
          </button>
          <button
            onClick={() => setActiveTab("ops")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ops"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            Yönetim
          </button>
        </div>
        <CommandList>
          <CommandEmpty>Seçenek bulunamadı.</CommandEmpty>
          {getFilteredOptions().map((option) => {
            // Güncellenmiş kısayolları bul
            const updatedShortcut = shortcuts.find((s) => s.label === option.label);
            const displayKeys = updatedShortcut
              ? [updatedShortcut.keys[0], updatedShortcut.keys[1]]
              : option.keys;

            return (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                <div className="ml-auto flex items-center gap-1">
                  {displayKeys.map((key, idx) => (
                    <React.Fragment key={idx}>
                      <Kbd className="text-xs">{key}</Kbd>
                      {idx < displayKeys.length - 1 && (
                        <span className="text-xs text-muted-foreground">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CommandItem>
            );
          })}
        </CommandList>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Kısayolları özelleştir</p>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/ops/settings?tab=shortcuts");
            }}
            className="text-xs text-primary hover:underline font-medium"
          >
            Ayarlar →
          </button>
        </div>
      </CommandDialog>
    </>
  );
}

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <>
      <QuickCreateDialog />
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2"></SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
              return item.items && item.items.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
