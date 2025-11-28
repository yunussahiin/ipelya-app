/**
 * AI Full Page Chat
 * Thread sidebar + Chat arayüzü
 * Thread'ler Supabase'e kaydedilir
 */

"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings2, PanelLeft, PanelLeftClose } from "lucide-react";
import Link from "next/link";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { toast } from "sonner";
import { Thread } from "@/components/assistant-ui/thread";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RECOMMENDED_MODELS } from "@/lib/ai/types";
import { CreditsBadge } from "./CreditsBadge";
import { AIThreadSidebar } from "./AIThreadSidebar";
import { AllToolUIs } from "@/components/tool-ui/tool-uis";

const STORAGE_KEY = "ai-chat-selected-model";
const THREAD_STORAGE_KEY = "ai-chat-current-thread";

interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export function AIFullPageChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshSidebar, setRefreshSidebar] = useState(0); // Sidebar'ı yenilemek için
  const [initialMessages, setInitialMessages] = useState<ThreadMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Thread ID - URL'den al, yoksa localStorage'dan
  const threadIdFromUrl = searchParams.get("thread");
  const [storedThreadId, setStoredThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(THREAD_STORAGE_KEY);
  });

  // Aktif thread ID - URL öncelikli
  const currentThreadId = threadIdFromUrl || storedThreadId;

  console.log("[AIFullPageChat] 📊 State:", {
    threadIdFromUrl,
    storedThreadId,
    currentThreadId,
    initialMessagesCount: initialMessages.length
  });

  // Thread mesajlarını yükle
  useEffect(() => {
    async function loadThreadMessages() {
      if (!currentThreadId) {
        console.log("[AIFullPageChat] 📭 No thread selected, clearing messages");
        setInitialMessages([]);
        return;
      }

      console.log("[AIFullPageChat] 📥 Loading messages for thread:", currentThreadId);
      setIsLoadingMessages(true);

      try {
        const response = await fetch(`/api/ops/ai/threads/${currentThreadId}`);
        if (!response.ok) {
          console.error("[AIFullPageChat] ❌ Failed to load thread");
          return;
        }

        const data = await response.json();
        const messages = data.thread?.messages || [];
        console.log("[AIFullPageChat] ✅ Loaded messages:", messages.length);
        setInitialMessages(messages);
        // Key'i değiştirmiyoruz - input'a yazamama sorunu oluşturuyor
      } catch (error) {
        console.error("[AIFullPageChat] ❌ Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadThreadMessages();
  }, [currentThreadId]);

  // localStorage'ı güncelle (URL'den gelen değer için)
  useEffect(() => {
    if (threadIdFromUrl) {
      console.log("[AIFullPageChat] 💾 Saving threadId to localStorage:", threadIdFromUrl);
      localStorage.setItem(THREAD_STORAGE_KEY, threadIdFromUrl);
    }
  }, [threadIdFromUrl]);

  // Model seçimini localStorage'dan yükle
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || RECOMMENDED_MODELS[0]?.id || "";
    }
    return RECOMMENDED_MODELS[0]?.id || "";
  });

  // Model değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(STORAGE_KEY, selectedModel);
    }
  }, [selectedModel]);

  // Transport - model ve threadId ile
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/ops/ai/chat",
        body: { model: selectedModel, threadId: currentThreadId }
      }),
    [selectedModel, currentThreadId]
  );

  // Hata yönetimi
  const handleError = useCallback((error: Error) => {
    console.error("[AIFullPageChat] ❌ Chat error:", error);
    console.log("[AIFullPageChat] 🔔 Showing toast for error:", error.message);

    // Rate limit hatası
    if (
      error.message.includes("429") ||
      error.message.includes("rate limit") ||
      error.message.includes("rate-limited")
    ) {
      console.log("[AIFullPageChat] 🔔 Rate limit toast");
      toast.error("Rate limit aşıldı", {
        description: "Bu model şu anda yoğun. Lütfen farklı bir model deneyin veya biraz bekleyin.",
        duration: 8000
      });
      return;
    }

    // Provider hatası
    if (error.message.includes("Provider returned error")) {
      console.log("[AIFullPageChat] 🔔 Provider error toast");
      toast.error("Model hatası", {
        description: "Seçilen model şu anda kullanılamıyor. Lütfen farklı bir model deneyin.",
        duration: 8000
      });
      return;
    }

    // Genel hata
    toast.error("Bir hata oluştu", {
      description: error.message || "Lütfen tekrar deneyin.",
      duration: 5000
    });
  }, []);

  const runtime = useChatRuntime({
    transport,
    id: currentThreadId || "new-chat",
    onError: handleError
  });

  // Thread seç
  const handleSelectThread = useCallback(
    (threadId: string) => {
      console.log("[AIFullPageChat] 👆 Thread selected:", threadId);
      if (threadId === currentThreadId) {
        console.log("[AIFullPageChat] ⏭️ Same thread, skipping");
        return;
      }

      // Mesajları temizle ve loading göster
      setInitialMessages([]);
      setIsLoadingMessages(true);

      // State güncelle
      setStoredThreadId(threadId);
      localStorage.setItem(THREAD_STORAGE_KEY, threadId);
      router.push(`/ops/ai?thread=${threadId}`);
    },
    [currentThreadId, router]
  );

  // Yeni sohbet başlat
  const handleNewThread = useCallback(() => {
    console.log("[AIFullPageChat] ➕ New thread started");

    // Mesajları temizle
    setInitialMessages([]);
    setIsLoadingMessages(false);

    // State temizle
    setStoredThreadId(null);
    localStorage.removeItem(THREAD_STORAGE_KEY);
    router.push("/ops/ai");
  }, [router]);

  // Sidebar'ı yenile (mesaj gönderildikten sonra çağrılacak)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRefreshSidebar = useCallback(() => {
    console.log("[AIFullPageChat] 🔄 Refreshing sidebar");
    setRefreshSidebar((r) => r + 1);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header with Model Selection */}
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <h1 className="text-lg font-semibold">AI Asistan</h1>
          </div>

          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 w-[240px]">
                <SelectValue placeholder="Model seçin" />
              </SelectTrigger>
              <SelectContent>
                {RECOMMENDED_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{model.name}</span>
                      {model.free && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Free
                        </Badge>
                      )}
                      {model.supportsTools && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 text-green-600 border-green-600"
                        >
                          DB
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CreditsBadge />

            <Link href="/ops/ai/settings">
              <Button variant="outline" size="sm">
                Ayarlar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Thread Sidebar */}
        <div
          className={cn(
            "shrink-0 border-r bg-muted/30 transition-all duration-300 overflow-hidden",
            sidebarOpen ? "w-64" : "w-0"
          )}
        >
          <AIThreadSidebar
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            onNewThread={handleNewThread}
            refreshTrigger={refreshSidebar}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Loading skeleton */}
          {isLoadingMessages && (
            <div className="shrink-0 border-b bg-muted/30">
              <div className="max-w-3xl mx-auto px-4 py-3">
                <div className="h-4 w-32 bg-muted rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="h-10 w-40 rounded-xl bg-muted animate-pulse" />
                  </div>
                  <div className="flex justify-start">
                    <div className="h-12 w-56 rounded-xl bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Önceki mesajlar önizlemesi */}
          {initialMessages.length > 0 && !isLoadingMessages && (
            <>
              <div className="shrink-0 border-b bg-muted/30">
                <div className="max-w-3xl mx-auto px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Önceki mesajlar ({initialMessages.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {initialMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border"
                          )}
                        >
                          <p className="line-clamp-2 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 bg-muted/50 border-b px-4 py-2">
                <p className="text-xs text-muted-foreground text-center">
                  Bu sohbette {initialMessages.length} önceki mesaj var. AI bu mesajları hatırlıyor.
                </p>
              </div>
            </>
          )}

          {/* Thread component - her zaman göster */}
          <div className="flex-1 overflow-hidden">
            <AssistantRuntimeProvider runtime={runtime}>
              {/* Tool UI'ları register et - her tool için özel UI */}
              <AllToolUIs />
              <Thread />
            </AssistantRuntimeProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
