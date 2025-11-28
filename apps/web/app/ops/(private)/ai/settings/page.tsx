/**
 * AI Settings Page
 * Web Ops AI ayarları yönetim sayfası
 *
 * - Model seçimi
 * - System prompt ayarları
 * - Tool izinleri
 * - Rate limit ayarları
 */

import { Metadata } from "next";
import { AISettingsForm } from "@/components/ops/ai/AISettingsForm";

export const metadata: Metadata = {
  title: "AI Ayarları | İpelya Ops",
  description: "AI model ve sistem ayarları"
};

export default function AISettingsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Ayarları</h1>
            <p className="text-sm text-muted-foreground">
              Model, system prompt ve tool izinlerini yapılandırın
            </p>
          </div>
          <a
            href="/ops/ai"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
          >
            ← Chat&apos;e Dön
          </a>
        </div>
      </div>

      {/* Settings Form */}
      <AISettingsForm />
    </div>
  );
}
