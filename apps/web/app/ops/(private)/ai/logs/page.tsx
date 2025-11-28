/**
 * AI Logs Page
 * Web Ops AI chat logları görüntüleme sayfası
 */

import { Metadata } from "next";
import { AILogsTable } from "@/components/ops/ai/AILogsTable";

export const metadata: Metadata = {
  title: "AI Logları | İpelya Ops",
  description: "AI chat logları ve istatistikleri"
};

export default function AILogsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Logları</h1>
            <p className="text-sm text-muted-foreground">
              Chat geçmişi, token kullanımı ve performans metrikleri
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

      {/* Logs Table */}
      <AILogsTable />
    </div>
  );
}
