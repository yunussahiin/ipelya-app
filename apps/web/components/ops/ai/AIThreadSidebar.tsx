/**
 * AI Thread Sidebar
 * Sohbet geçmişini gösteren sidebar
 * shadcn sidebar component'ini kullanır
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MessageSquare, Trash2, Archive, MoreVertical, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  title: string | null;
  model: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface AIThreadSidebarProps {
  currentThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  refreshTrigger?: number; // Dışarıdan tetiklenen yenileme
}

export function AIThreadSidebar({
  currentThreadId,
  onSelectThread,
  onNewThread,
  refreshTrigger = 0
}: AIThreadSidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);

  // Thread listesini yükle
  const loadThreads = useCallback(async () => {
    console.log("[AIThreadSidebar] 📥 Loading threads...");
    try {
      const response = await fetch("/api/ops/ai/threads");
      if (!response.ok) throw new Error("Failed to load threads");
      const data = await response.json();
      console.log("[AIThreadSidebar] ✅ Loaded threads:", data.threads?.length || 0);
      setThreads(data.threads || []);
    } catch (error) {
      console.error("[AIThreadSidebar] ❌ Error loading threads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // İlk yüklemede ve periyodik olarak thread'leri yükle
  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 5000); // Her 5 saniyede (daha sık)
    return () => clearInterval(interval);
  }, [loadThreads]);

  // Dışarıdan tetiklenen yenileme
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("[AIThreadSidebar] 🔄 External refresh triggered");
      loadThreads();
    }
  }, [refreshTrigger, loadThreads]);

  // Thread seç - loglama ekle
  const handleSelectThread = (threadId: string) => {
    console.log("[AIThreadSidebar] 👆 Thread clicked:", threadId);
    onSelectThread(threadId);
  };

  // Thread sil
  const handleDeleteThread = async () => {
    if (!deleteThreadId) return;
    console.log("[AIThreadSidebar] 🗑️ Deleting thread:", deleteThreadId);

    try {
      const response = await fetch(`/api/ops/ai/threads/${deleteThreadId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete thread");

      setThreads((prev) => prev.filter((t) => t.id !== deleteThreadId));

      // Eğer silinen thread aktifse, yeni sohbet başlat
      if (currentThreadId === deleteThreadId) {
        onNewThread();
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    } finally {
      setDeleteThreadId(null);
    }
  };

  // Thread arşivle
  const handleArchiveThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/ops/ai/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true })
      });
      if (!response.ok) throw new Error("Failed to archive thread");

      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, is_archived: true } : t)));
    } catch (error) {
      console.error("Error archiving thread:", error);
    }
  };

  // Aktif ve arşivlenmiş thread'leri ayır
  const activeThreads = threads.filter((t) => !t.is_archived);
  const archivedThreads = threads.filter((t) => t.is_archived);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Sohbetler</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNewThread}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Yeni Sohbet Butonu */}
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-2 px-3 py-2", !currentThreadId && "bg-accent")}
            onClick={onNewThread}
          >
            <Plus className="h-4 w-4" />
            Yeni Sohbet
          </Button>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Active Threads */}
          {activeThreads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={currentThreadId === thread.id}
              onSelect={() => handleSelectThread(thread.id)}
              onArchive={() => handleArchiveThread(thread.id)}
              onDelete={() => setDeleteThreadId(thread.id)}
            />
          ))}

          {/* Archived Threads */}
          {archivedThreads.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground mt-4">
                Arşivlenmiş ({archivedThreads.length})
              </div>
              {archivedThreads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={currentThreadId === thread.id}
                  isArchived
                  onSelect={() => handleSelectThread(thread.id)}
                  onDelete={() => setDeleteThreadId(thread.id)}
                />
              ))}
            </>
          )}

          {/* Boş durum */}
          {!isLoading && threads.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Henüz sohbet yok.
              <br />
              Yeni bir sohbet başlatın!
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteThreadId} onOpenChange={() => setDeleteThreadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sohbeti Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sohbeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteThread}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Thread Item Component
interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  isArchived?: boolean;
  onSelect: () => void;
  onArchive?: () => void;
  onDelete: () => void;
}

function ThreadItem({
  thread,
  isActive,
  isArchived,
  onSelect,
  onArchive,
  onDelete
}: ThreadItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
        isActive ? "bg-accent" : "hover:bg-accent/50",
        isArchived && "opacity-60"
      )}
      onClick={onSelect}
    >
      {isArchived ? (
        <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{thread.title || "Yeni Sohbet"}</div>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(thread.updated_at || thread.created_at), {
            addSuffix: true,
            locale: tr
          })}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isArchived && onArchive && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Arşivle
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
