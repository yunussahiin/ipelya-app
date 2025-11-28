/**
 * AI Assistant Provider
 * Ops layout'unda AI asistan için runtime sağlar
 * Modal ve sidebar için kullanılır
 */

"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { AssistantModal } from "@/components/assistant-ui/assistant-modal";

interface AIAssistantProviderProps {
  children: React.ReactNode;
}

export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const pathname = usePathname();

  // AI sayfasında modal'ı gösterme (zaten full page chat var)
  const isAIPage = pathname?.startsWith("/ops/ai");

  // Transport'u memoize et - her render'da yeni instance oluşturma
  const transport = useMemo(() => new AssistantChatTransport({ api: "/api/ops/ai/chat" }), []);

  // useChatRuntime ile assistant-ui runtime oluştur
  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
      {/* Floating AI Assistant Modal - sağ altta (AI sayfası hariç) */}
      {!isAIPage && <AssistantModal />}
    </AssistantRuntimeProvider>
  );
}
