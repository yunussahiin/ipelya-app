"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import {
  SettingsLayout,
  // OpenRouter API Sections
  CreditsSection,
  ModelsSection,
  ApiKeysSection,
  AnalyticsSection,
  // AI System Sections
  PreferencesSection,
  ToolsSection,
  PromptsSection,
  LogsSection,
  DatabaseSection
} from "@/components/ops/ai/settings";

export function AISettingsClient() {
  const [activeSection, setActiveSection] = useState("credits");

  const renderSection = () => {
    switch (activeSection) {
      // OpenRouter API
      case "credits":
        return <CreditsSection />;
      case "models":
        return <ModelsSection />;
      case "api-keys":
        return <ApiKeysSection />;
      case "analytics":
        return <AnalyticsSection />;
      // AI System
      case "preferences":
        return <PreferencesSection />;
      case "tools":
        return <ToolsSection />;
      case "prompts":
        return <PromptsSection />;
      case "logs":
        return <LogsSection />;
      case "database":
        return <DatabaseSection />;
      default:
        return <CreditsSection />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/ops/ai">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-lg font-semibold">AI Ayarları</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <SettingsLayout activeSection={activeSection} onSectionChange={setActiveSection}>
        {renderSection()}
      </SettingsLayout>
    </div>
  );
}
