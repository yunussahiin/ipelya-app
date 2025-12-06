"use client";

/**
 * Session Detail Page
 * Oturum detayı ve canlı izleme sayfası
 * - Video: 3 Kolonlu Layout (Mesajlar | iPhone | Katılımcılar)
 * - Sesli Oda: 2 Kolonlu Layout (Katılımcılar | AudioRoom)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  SessionHeader,
  SessionStats,
  MessagesPanel,
  ParticipantsPanel,
  VideoPreviewPanel,
  AudioRoomPanel,
  MessageActionDialog,
  type SessionWithDetails,
  type LiveMessage,
  type MessageActionType,
  type LiveParticipant
} from "./components";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Telefon zoom state
  const [phoneZoom, setPhoneZoom] = useState<"1x" | "2x" | "3x" | "4x">("1x");

  // Mesaj aksiyonları için state
  const [selectedMessage, setSelectedMessage] = useState<LiveMessage | null>(null);
  const [messageAction, setMessageAction] = useState<MessageActionType>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Supabase client ve scroll ref
  const supabase = createBrowserSupabaseClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mesaj listesini en alta kaydır
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [sessionRes, participantsRes, messagesRes] = await Promise.all([
        fetch(`/api/ops/live/sessions/${sessionId}`),
        fetch(`/api/ops/live/sessions/${sessionId}/participants?active=false`),
        fetch(`/api/ops/live/sessions/${sessionId}/messages?limit=50`)
      ]);

      if (!sessionRes.ok) throw new Error("Oturum bulunamadı");

      const sessionData = await sessionRes.json();
      setSession(sessionData);

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.participants || []);
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        const sortedMessages = (messagesData.messages || []).sort(
          (a: LiveMessage, b: LiveMessage) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Realtime mesaj subscription
  useEffect(() => {
    const channel = supabase
      .channel(`live_messages_${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_messages" },
        () => {
          fetchData();
          setTimeout(scrollToBottom, 200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, fetchData, scrollToBottom]);

  // Mesajlar yüklendiğinde en alta kaydır
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [loading, messages.length, scrollToBottom]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleMessageAction = async () => {
    if (!selectedMessage || !messageAction) return;

    setActionLoading(true);
    try {
      if (messageAction === "delete") {
        const response = await fetch(`/api/ops/live/messages/${selectedMessage.id}/delete`, {
          method: "POST"
        });
        if (!response.ok) throw new Error("Mesaj silinemedi");
        toast.success("Mesaj silindi");
      } else {
        const endpoint =
          messageAction === "kick"
            ? `/api/ops/live/users/${selectedMessage.sender_id}/kick`
            : `/api/ops/live/users/${selectedMessage.sender_id}/ban`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            reason: `Admin tarafından ${messageAction === "kick" ? "çıkarıldı" : "yasaklandı"}`
          })
        });
        if (!response.ok) throw new Error("İşlem başarısız");
        toast.success(messageAction === "kick" ? "Kullanıcı çıkarıldı" : "Kullanıcı yasaklandı");
      }
      handleRefresh();
    } catch (error) {
      toast.error("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setActionLoading(false);
      setSelectedMessage(null);
      setMessageAction(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">Oturum bulunamadı</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    );
  }

  const isAudioRoom = session.session_type === "audio_room";

  return (
    <div className="space-y-6">
      <SessionHeader
        session={session}
        refreshing={refreshing}
        onBack={() => router.back()}
        onRefresh={handleRefresh}
        onSessionEnd={() => router.push("/ops/live")}
      />

      <SessionStats session={session} />

      {/* Layout: Video için 3 kolon, Sesli Oda için 2 kolon */}
      {isAudioRoom ? (
        /* AUDIO LAYOUT: Sol dar (Katılımcılar) + Sağ geniş (AudioRoom) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <ParticipantsPanel
              participants={participants}
              sessionId={session.id}
              onRefresh={handleRefresh}
            />
          </div>
          <div className="lg:col-span-9 order-1 lg:order-2">
            <AudioRoomPanel session={session} />
          </div>
        </div>
      ) : (
        /* VIDEO LAYOUT: 3 Kolonlu (Mesajlar | iPhone | Katılımcılar) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <MessagesPanel
              ref={messagesEndRef}
              messages={messages}
              onMessageAction={(msg, action) => {
                setSelectedMessage(msg);
                setMessageAction(action);
              }}
            />
          </div>
          <div className="lg:col-span-4 order-1 lg:order-2">
            <VideoPreviewPanel
              session={session}
              phoneZoom={phoneZoom}
              onZoomChange={setPhoneZoom}
            />
          </div>
          <div className="lg:col-span-4 order-3">
            <ParticipantsPanel
              participants={participants}
              sessionId={session.id}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      )}

      <MessageActionDialog
        selectedMessage={selectedMessage}
        messageAction={messageAction}
        actionLoading={actionLoading}
        onClose={() => setSelectedMessage(null)}
        onConfirm={handleMessageAction}
      />
    </div>
  );
}
