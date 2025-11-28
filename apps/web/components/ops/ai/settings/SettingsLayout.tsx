"use client";

import { cn } from "@/lib/utils";
import {
  Wallet,
  Bot,
  Wrench,
  MessageSquare,
  BarChart3,
  ChevronRight,
  Globe,
  Key,
  Database,
  Sliders,
  FileText,
  Zap
} from "lucide-react";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface SettingsCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  sections: SettingsSection[];
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: "openrouter",
    label: "OpenRouter API",
    icon: <Globe className="h-4 w-4" />,
    sections: [
      {
        id: "credits",
        label: "Kredi Durumu",
        icon: <Wallet className="h-4 w-4" />,
        description: "OpenRouter hesap bakiyesi ve kullanım"
      },
      {
        id: "models",
        label: "Model Listesi",
        icon: <Bot className="h-4 w-4" />,
        description: "Kullanılabilir modeller ve özellikleri"
      },
      {
        id: "api-keys",
        label: "API Anahtarları",
        icon: <Key className="h-4 w-4" />,
        description: "OpenRouter API key yönetimi"
      },
      {
        id: "analytics",
        label: "Kullanım Analitikleri",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Token kullanımı ve maliyet raporları"
      },
      {
        id: "providers",
        label: "Providers",
        icon: <Globe className="h-4 w-4" />,
        description: "AI model sağlayıcıları listesi"
      }
    ]
  },
  {
    id: "ai-system",
    label: "AI Sistem Ayarları",
    icon: <Zap className="h-4 w-4" />,
    sections: [
      {
        id: "preferences",
        label: "Model Tercihleri",
        icon: <Sliders className="h-4 w-4" />,
        description: "Varsayılan model, temperature ve parametreler"
      },
      {
        id: "tools",
        label: "Tool Ayarları",
        icon: <Wrench className="h-4 w-4" />,
        description: "Veritabanı tool izinleri ve yapılandırması"
      },
      {
        id: "prompts",
        label: "System Prompts",
        icon: <MessageSquare className="h-4 w-4" />,
        description: "Preset ve özel system promptlar"
      },
      {
        id: "logs",
        label: "Chat Logları",
        icon: <FileText className="h-4 w-4" />,
        description: "AI sohbet geçmişi ve loglar"
      },
      {
        id: "database",
        label: "Veritabanı Şeması",
        icon: <Database className="h-4 w-4" />,
        description: "AI tool'larının eriştiği tablolar"
      }
    ]
  }
];

// Flat list for easy lookup
const SETTINGS_SECTIONS: SettingsSection[] = SETTINGS_CATEGORIES.flatMap((cat) => cat.sections);

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SettingsLayout({ children, activeSection, onSectionChange }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-muted/30 p-4">
        <nav className="space-y-6">
          {SETTINGS_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category.icon}
                <span>{category.label}</span>
              </div>

              {/* Category Sections */}
              <div className="space-y-0.5">
                {category.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      activeSection === section.id
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {section.icon}
                    <span className="flex-1 text-left">{section.label}</span>
                    {activeSection === section.id && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label}
          </h2>
          <p className="text-sm text-muted-foreground">
            {SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.description}
          </p>
        </div>

        {/* Section Content */}
        {children}
      </main>
    </div>
  );
}

export { SETTINGS_SECTIONS, SETTINGS_CATEGORIES };
export type { SettingsSection, SettingsCategory };
