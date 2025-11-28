"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { toast } from "sonner";

interface UnreadInfo {
  totalUnread: number;
  senders: { name: string; count: number }[];
}

export function AdminChatButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadInfo, setUnreadInfo] = useState<UnreadInfo>({ totalUnread: 0, senders: [] });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const hasShownToast = useRef(false);
  const isOnAdminChatPage = pathname === "/ops/admin-chat";

  // Kullanıcı ID'sini al
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  // Okunmamış mesajları yükle
  useEffect(() => {
    if (!currentUserId) return;

    const loadUnreadMessages = async () => {
      const supabase = createBrowserSupabaseClient();

      // Okunmamış mesaj sayısını al
      const { data: participations, error } = await supabase
        .from("ops_conversation_participants")
        .select(
          `
          unread_count,
          conversation_id
        `
        )
        .eq("admin_id", currentUserId)
        .gt("unread_count", 0);

      if (error) {
        console.error("[AdminChatButton] Error loading unread:", error);
        return;
      }

      if (!participations || participations.length === 0) {
        setUnreadInfo({ totalUnread: 0, senders: [] });
        return;
      }

      // Toplam okunmamış sayısı
      const totalUnread = participations.reduce((sum, p) => sum + (p.unread_count || 0), 0);

      // Her conversation için son mesajı göndereni bul
      const conversationIds = participations.map((p) => p.conversation_id);

      const { data: lastMessages } = await supabase
        .from("ops_messages")
        .select(
          `
          conversation_id,
          sender_id
        `
        )
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      // Unique sender'ları bul
      const senderIds = [
        ...new Set(lastMessages?.map((m) => m.sender_id).filter((id) => id !== currentUserId) || [])
      ];

      // Sender isimlerini al
      const { data: senderProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", senderIds)
        .eq("type", "real");

      const senders =
        senderProfiles
          ?.map((p) => ({
            name: p.display_name || p.username || "Admin",
            count: participations
              .filter((part) => {
                const msg = lastMessages?.find((m) => m.conversation_id === part.conversation_id);
                return msg?.sender_id === p.user_id;
              })
              .reduce((sum, part) => sum + (part.unread_count || 0), 0)
          }))
          .filter((s) => s.count > 0) || [];

      setUnreadInfo({ totalUnread, senders });
    };

    loadUnreadMessages();

    // Realtime subscription for new messages
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("admin-chat-unread")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ops_messages"
        },
        () => {
          // Yeni mesaj geldiğinde unread'i yeniden yükle
          loadUnreadMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ops_conversation_participants",
          filter: `admin_id=eq.${currentUserId}`
        },
        () => {
          // Participant güncellendiğinde (okundu işareti vs)
          loadUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Toast bildirimi göster (sadece bir kere, admin-chat sayfasında değilse)
  useEffect(() => {
    if (
      !isOnAdminChatPage &&
      unreadInfo.totalUnread > 0 &&
      unreadInfo.senders.length > 0 &&
      !hasShownToast.current
    ) {
      const senderNames = unreadInfo.senders.map((s) => s.name).join(", ");
      toast.info(
        `💬 ${senderNames} adlı kullanıcıdan ${unreadInfo.totalUnread} okunmamış mesajınız var`,
        {
          action: {
            label: "Görüntüle",
            onClick: () => router.push("/ops/admin-chat")
          },
          duration: 8000
        }
      );
      hasShownToast.current = true;
    }
  }, [unreadInfo, isOnAdminChatPage, router]);

  // Admin chat sayfasına gittiğinde toast flag'ini sıfırla
  useEffect(() => {
    if (isOnAdminChatPage) {
      hasShownToast.current = false;
    }
  }, [isOnAdminChatPage]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => router.push("/ops/admin-chat")}
      title="Admin Chat"
    >
      <MessageCircle className="h-5 w-5" />
      {unreadInfo.totalUnread > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {unreadInfo.totalUnread > 99 ? "99+" : unreadInfo.totalUnread}
        </span>
      )}
    </Button>
  );
}
