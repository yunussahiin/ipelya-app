"use client";

import { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ConversationList, ChatWindow, NewChatDialog } from "./components";
import { useConversations } from "./hooks";
import { cn } from "@/lib/utils";
import type { OpsConversation } from "./types";

export default function AdminChatPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<OpsConversation | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const supabase = createBrowserSupabaseClient();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase.auth]);

  const { conversations, isLoading, addConversation, updateConversation } =
    useConversations(currentUserId);

  // Handle conversation update (from ChatHeader)
  const handleConversationUpdate = useCallback(
    (updatedConversation: OpsConversation) => {
      updateConversation(updatedConversation);
      if (activeConversation?.id === updatedConversation.id) {
        setActiveConversation(updatedConversation);
      }
    },
    [activeConversation?.id, updateConversation]
  );

  // Auto-select first conversation when loaded
  const firstConversation = conversations[0];
  const shouldAutoSelect = !isLoading && firstConversation && !activeConversation;

  useEffect(() => {
    if (shouldAutoSelect) {
      setActiveConversation(firstConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoSelect]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation: OpsConversation) => {
    setActiveConversation(conversation);
  }, []);

  // Handle new conversation created
  const handleConversationCreated = useCallback(
    (conversation: OpsConversation) => {
      addConversation(conversation);
      setActiveConversation(conversation);
    },
    [addConversation]
  );

  // Mobile: select conversation and close drawer
  const handleMobileSelect = useCallback((conversation: OpsConversation) => {
    setActiveConversation(conversation);
    setIsMobileDrawerOpen(false);
  }, []);

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-120px)] md:gap-4">
      {/* Desktop Header - hidden on mobile */}
      <div className="hidden md:flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Chat</h1>
          <p className="text-sm text-muted-foreground">Diğer admin&apos;lerle mesajlaşın</p>
        </div>
        <NewChatDialog
          currentUserId={currentUserId}
          existingConversations={conversations}
          onConversationCreated={handleConversationCreated}
        />
      </div>

      {/* Chat Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden md:gap-4">
        {/* Desktop Sidebar */}
        <div
          className={cn(
            "hidden md:block min-h-0 overflow-hidden transition-all duration-300 shrink-0",
            isSidebarCollapsed ? "w-16" : "w-80"
          )}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id || null}
            currentUserId={currentUserId}
            isLoading={isLoading}
            onSelect={handleSelectConversation}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Drawer */}
        <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
            <div className="flex-1 overflow-hidden flex flex-col">
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversation?.id || null}
                currentUserId={currentUserId}
                isLoading={isLoading}
                onSelect={handleMobileSelect}
              />
            </div>
            <div className="p-4 border-t space-y-2">
              <NewChatDialog
                currentUserId={currentUserId}
                existingConversations={conversations}
                onConversationCreated={(conv) => {
                  handleConversationCreated(conv);
                  setIsMobileDrawerOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Chat Window - full width on mobile */}
        <div className="flex-1 min-h-0 overflow-hidden w-full">
          <ChatWindow
            conversation={activeConversation}
            currentUserId={currentUserId}
            onConversationUpdate={handleConversationUpdate}
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
