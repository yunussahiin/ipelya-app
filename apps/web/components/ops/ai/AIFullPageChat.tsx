/**
 * AI Full Page Chat
 * Thread list (sidebar) + Thread (main chat) yan yana
 * Kendi runtime'ını yönetir (model seçimi için)
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { PanelLeftClose, PanelLeft, Settings2 } from "lucide-react";
import Link from "next/link";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
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

const STORAGE_KEY = "ai-chat-selected-model";

export function AIFullPageChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Chat ID - her oturum için benzersiz
  const [chatId] = useState(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("ai-chat-current-id");
      if (savedId) return savedId;
      const newId = `chat-${Date.now()}`;
      localStorage.setItem("ai-chat-current-id", newId);
      return newId;
    }
    return `chat-${Date.now()}`;
  });

  // Transport'u model değiştiğinde yeniden oluştur
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/ops/ai/chat",
        body: { model: selectedModel }
      }),
    [selectedModel]
  );

  const runtime = useChatRuntime({
    transport,
    id: chatId // Chat ID ile persistence sağla
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header with Model Selection */}
      <div className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
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

            <Link href="/ops/ai/settings">
              <Button variant="outline" size="sm">
                Ayarlar
              </Button>
            </Link>
            <Link href="/ops/ai/logs">
              <Button variant="outline" size="sm">
                Loglar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - AssistantRuntimeProvider ile sarmalı */}
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="flex flex-1 min-h-0">
          {/* Thread List Sidebar */}
          <div
            className={cn(
              "shrink-0 border-r bg-muted/30 transition-all duration-300",
              sidebarOpen ? "w-64" : "w-0 overflow-hidden"
            )}
          >
            <div className="flex h-full flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">Sohbetler</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto">
                <ThreadList />
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Thread */}
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </div>
        </div>
      </AssistantRuntimeProvider>
    </div>
  );
}
