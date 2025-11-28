/**
 * AI Chat Page
 * Web Ops AI Chat arayüzü
 *
 * assistant-ui component'leri kullanıyoruz.
 * Runtime layout'ta AIAssistantProvider ile sağlanıyor.
 */

import { Metadata } from "next";
import { AIFullPageChat } from "@/components/ops/ai/AIFullPageChat";
import { AIErrorBoundary } from "@/components/ops/ai/AIErrorBoundary";

export const metadata: Metadata = {
  title: "AI Chat | İpelya Ops",
  description: "AI destekli platform yönetim asistanı"
};

export default function AIChatPage() {
  return (
    <div className="h-[calc(100vh-var(--header-height)-2rem)] -mx-4 -my-4 md:-mx-6 md:-my-6">
      <AIErrorBoundary>
        <AIFullPageChat />
      </AIErrorBoundary>
    </div>
  );
}
