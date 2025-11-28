/**
 * Thread Persistence Hook
 * AI chat thread'lerini Supabase'e kaydetme ve yükleme
 */

import { useState, useEffect, useCallback } from "react";

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  createdAt: string;
}

export interface Thread {
  id: string;
  title: string | null;
  model: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  messages?: ThreadMessage[];
}

export function useThreadPersistence() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Thread listesini yükle
  const loadThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/ops/ai/threads");
      if (!response.ok) {
        throw new Error("Failed to load threads");
      }
      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Belirli bir thread'i yükle
  const loadThread = useCallback(async (threadId: string) => {
    try {
      const response = await fetch(`/api/ops/ai/threads/${threadId}`);
      if (!response.ok) {
        throw new Error("Failed to load thread");
      }
      const data = await response.json();
      setCurrentThread(data.thread);
      setCurrentThreadId(threadId);
      return data.thread;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  // Yeni thread oluştur
  const createThread = useCallback(async (title?: string, model?: string) => {
    try {
      const response = await fetch("/api/ops/ai/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, model }),
      });
      if (!response.ok) {
        throw new Error("Failed to create thread");
      }
      const data = await response.json();
      const newThread = data.thread;
      
      // Listeye ekle
      setThreads((prev) => [newThread, ...prev]);
      setCurrentThread(newThread);
      setCurrentThreadId(newThread.id);
      
      return newThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, []);

  // Thread güncelle
  const updateThread = useCallback(async (
    threadId: string,
    updates: { title?: string; is_archived?: boolean; model?: string; messages?: ThreadMessage[] }
  ) => {
    try {
      const response = await fetch(`/api/ops/ai/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Failed to update thread");
      }
      const data = await response.json();
      
      // Listeyi güncelle
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, ...data.thread } : t))
      );
      
      if (currentThreadId === threadId) {
        setCurrentThread((prev) => prev ? { ...prev, ...data.thread } : null);
      }
      
      return data.thread;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, [currentThreadId]);

  // Thread sil
  const deleteThread = useCallback(async (threadId: string) => {
    try {
      const response = await fetch(`/api/ops/ai/threads/${threadId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete thread");
      }
      
      // Listeden kaldır
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      
      if (currentThreadId === threadId) {
        setCurrentThread(null);
        setCurrentThreadId(null);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, [currentThreadId]);

  // Thread arşivle
  const archiveThread = useCallback(async (threadId: string) => {
    return updateThread(threadId, { is_archived: true });
  }, [updateThread]);

  // Thread seç
  const selectThread = useCallback(async (threadId: string) => {
    return loadThread(threadId);
  }, [loadThread]);

  // İlk yüklemede thread listesini al
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return {
    threads,
    currentThread,
    currentThreadId,
    isLoading,
    error,
    loadThreads,
    loadThread,
    createThread,
    updateThread,
    deleteThread,
    archiveThread,
    selectThread,
    setCurrentThreadId,
  };
}
