"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users,
  Search,
  FileText,
  BarChart3,
  Shield,
  Database,
  Activity,
  Ban,
  UserCheck,
  Flag,
  EyeOff,
  Trash2,
  Bell,
  Coins,
  Wallet,
  MessageSquare,
  MessagesSquare,
  Star,
  Lock,
  CheckCircle,
  XCircle,
  PlusCircle,
  LayoutDashboard,
  BadgeCheck,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: LucideIcon;
  category: string;
}

const TOOLS: Tool[] = [
  // Kullanıcı Yönetimi
  {
    id: "lookupUser",
    name: "Kullanıcı Detayı",
    description: "ID/email/username ile kullanıcı bul",
    example: "yunussahin38 kullanıcısını bul",
    icon: Users,
    category: "Kullanıcı"
  },
  {
    id: "searchUsers",
    name: "Kullanıcı Ara",
    description: "Kullanıcıları ara veya listele",
    example: "Tüm creator'ları listele",
    icon: Search,
    category: "Kullanıcı"
  },
  {
    id: "getUserActivity",
    name: "Aktivite Geçmişi",
    description: "Kullanıcı aktivitelerini göster",
    example: "X'in bu haftaki aktivitesi",
    icon: Activity,
    category: "Kullanıcı"
  },
  {
    id: "banUser",
    name: "Kullanıcı Banla",
    description: "Kullanıcıyı banla",
    example: "X'i 7 gün banla",
    icon: Ban,
    category: "Kullanıcı"
  },
  {
    id: "unbanUser",
    name: "Ban Kaldır",
    description: "Kullanıcının banını kaldır",
    example: "X'in banını kaldır",
    icon: UserCheck,
    category: "Kullanıcı"
  },
  {
    id: "verifyUser",
    name: "Kullanıcı Doğrula",
    description: "Kullanıcıya mavi tik ekle/kaldır",
    example: "X'i doğrula",
    icon: BadgeCheck,
    category: "Kullanıcı"
  },

  // İçerik
  {
    id: "getRecentPosts",
    name: "Son Postlar",
    description: "Son paylaşımları listele",
    example: "Son 20 postu göster",
    icon: FileText,
    category: "İçerik"
  },
  {
    id: "getPostDetails",
    name: "Post Detayları",
    description: "Post detaylarını getir",
    example: "X postunun detayları",
    icon: Database,
    category: "İçerik"
  },
  {
    id: "hidePost",
    name: "Post Gizle",
    description: "Postu gizle",
    example: "X postunu gizle",
    icon: EyeOff,
    category: "İçerik"
  },
  {
    id: "deletePost",
    name: "Post Sil",
    description: "Postu sil",
    example: "X postunu sil",
    icon: Trash2,
    category: "İçerik"
  },
  {
    id: "approvePost",
    name: "Post Onayla",
    description: "Bekleyen postu onayla",
    example: "X postunu onayla",
    icon: CheckCircle,
    category: "İçerik"
  },
  {
    id: "rejectPost",
    name: "Post Reddet",
    description: "Postu reddet ve bilgilendir",
    example: "X postunu reddet, spam",
    icon: XCircle,
    category: "İçerik"
  },

  // Moderasyon
  {
    id: "getModerationQueue",
    name: "Moderasyon Kuyruğu",
    description: "Bekleyen moderasyonlar",
    example: "Bekleyen moderasyonları göster",
    icon: Shield,
    category: "Moderasyon"
  },
  {
    id: "getContentReports",
    name: "İçerik Raporları",
    description: "Bildirilen içerikler",
    example: "Spam raporlarını göster",
    icon: Flag,
    category: "Moderasyon"
  },

  // Sistem
  {
    id: "getSystemStats",
    name: "Sistem İstatistikleri",
    description: "Platform istatistikleri",
    example: "Bu haftanın istatistikleri",
    icon: BarChart3,
    category: "Sistem"
  },
  {
    id: "getDashboardSummary",
    name: "Dashboard Özeti",
    description: "Günlük özet: kullanıcı, post, moderasyon",
    example: "Günlük özet ver",
    icon: LayoutDashboard,
    category: "Sistem"
  },

  // Bildirim
  {
    id: "sendNotification",
    name: "Bildirim Gönder",
    description: "Kullanıcıya bildirim gönder",
    example: "X'e uyarı bildirimi gönder",
    icon: Bell,
    category: "Bildirim"
  },

  // Finansal
  {
    id: "getUserTransactions",
    name: "Coin İşlemleri",
    description: "Kullanıcının coin işlemleri",
    example: "X'in bu ayki işlemleri",
    icon: Coins,
    category: "Finansal"
  },
  {
    id: "getUserBalance",
    name: "Coin Bakiyesi",
    description: "Kullanıcının coin bakiyesi",
    example: "X'in bakiyesi ne kadar?",
    icon: Wallet,
    category: "Finansal"
  },
  {
    id: "adjustCoinBalance",
    name: "Coin Ekle/Çıkar",
    description: "Kullanıcıya coin ekle veya çıkar",
    example: "X'e 100 coin ekle",
    icon: PlusCircle,
    category: "Finansal"
  },

  // Mesajlaşma
  {
    id: "getConversations",
    name: "Sohbet Listesi",
    description: "Sohbetleri listele",
    example: "X'in sohbetlerini göster",
    icon: MessagesSquare,
    category: "Mesajlaşma"
  },
  {
    id: "getMessages",
    name: "Mesajları Getir",
    description: "Sohbet mesajlarını getir",
    example: "X sohbetinin mesajları",
    icon: MessageSquare,
    category: "Mesajlaşma"
  },

  // Creator
  {
    id: "getCreatorStats",
    name: "Creator İstatistikleri",
    description: "Creator performans metrikleri",
    example: "Creator X'in istatistikleri",
    icon: Star,
    category: "Creator"
  },

  // Güvenlik
  {
    id: "getSecurityLogs",
    name: "Güvenlik Logları",
    description: "Güvenlik olayları",
    example: "X'in güvenlik logları",
    icon: Lock,
    category: "Güvenlik"
  }
];

interface ToolMentionPopupProps {
  isOpen: boolean;
  searchQuery: string;
  onSelect: (tool: Tool) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function ToolMentionPopup({
  isOpen,
  searchQuery,
  onSelect,
  onClose,
  position
}: ToolMentionPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // Filter tools based on search query
  const filteredTools = TOOLS.filter((tool) => {
    const query = searchQuery.toLowerCase();
    return (
      tool.id.toLowerCase().includes(query) ||
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  // Reset selected index when filtered tools change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredTools[selectedIndex]) {
            onSelect(filteredTools[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredTools, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || filteredTools.length === 0) return null;

  // Group tools by category
  const groupedTools = filteredTools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, Tool[]>
  );

  let globalIndex = 0;

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full mb-2 left-0 right-0 mx-4 max-h-80 overflow-y-auto rounded-xl border bg-popover shadow-lg z-50"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      <div className="p-2">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          @ Tool Seçimi - {filteredTools.length} sonuç
        </div>

        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category}>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {category}
            </div>
            {tools.map((tool) => {
              const currentIndex = globalIndex++;
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelect(tool)}
                  className={cn(
                    "w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left transition-colors",
                    currentIndex === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tool.name}</span>
                      <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
                        {tool.id}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                    <p className="text-xs text-muted-foreground/60 italic truncate">
                      Örnek: {tool.example}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook to manage tool mention state
export function useToolMention() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInputChange = useCallback((value: string, cursorPos: number) => {
    // Check if @ was typed
    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      // Check if @ is at start or after a space
      const charBeforeAt = textBeforeCursor[atIndex - 1];
      if (atIndex === 0 || charBeforeAt === " " || charBeforeAt === "\n") {
        const query = textBeforeCursor.slice(atIndex + 1);
        // Only show popup if query doesn't contain space (still typing tool name)
        if (!query.includes(" ")) {
          setIsOpen(true);
          setSearchQuery(query);
          setCursorPosition(cursorPos);
          return;
        }
      }
    }

    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const handleSelect = useCallback((tool: { example: string }) => {
    setIsOpen(false);
    setSearchQuery("");
    return tool.example;
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  return {
    isOpen,
    searchQuery,
    cursorPosition,
    handleInputChange,
    handleSelect,
    handleClose
  };
}

export { TOOLS };
export type { Tool };
