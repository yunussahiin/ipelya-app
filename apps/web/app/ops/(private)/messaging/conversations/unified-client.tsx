"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Search,
  Archive,
  MoreVertical,
  Flag,
  EyeOff,
  Eye,
  Trash2,
  Ghost,
  Shield,
  RefreshCw,
  MessageSquare,
  Send,
  AlertTriangle,
  X,
  Play,
  Volume2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { AvatarSmartGroup } from "@/components/ui/avatar-smart-group";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// ==================== TYPES ====================

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  gender?: "male" | "female" | "other" | null;
  is_creator?: boolean;
}

interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  created_at: string;
  is_archived: boolean;
  participants: Participant[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: string;
  media_url: string | null;
  media_metadata: { duration?: number } | null;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  is_hidden?: boolean;
  is_flagged?: boolean;
  is_shadow?: boolean;
  is_impersonated: boolean;
  created_at: string;
  sender_profile: Participant | null;
  admin_profile: Participant | null;
  reply_to?: {
    id: string;
    content: string;
    sender_profile: Participant | null;
  } | null;
}

interface UnifiedConversationsClientProps {
  conversations: Conversation[];
}

// ==================== MAIN COMPONENT ====================

export function UnifiedConversationsClient({
  conversations: initialConversations
}: UnifiedConversationsClientProps) {
  // ==================== STATE ====================

  // Conversations List State
  const [conversations] = useState<Conversation[]>(initialConversations);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Selected Conversation State
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Impersonate State - Basitleştirilmiş
  const [showImpersonate, setShowImpersonate] = useState(false);
  const [selectedImpersonateUser, setSelectedImpersonateUser] = useState<Participant | null>(null);
  const [impersonateMessages, setImpersonateMessages] = useState<Message[]>([]);
  const [impersonateHasMore, setImpersonateHasMore] = useState(false);
  const [impersonateCursor, setImpersonateCursor] = useState<string | null>(null);
  const [isLoadingMoreImpersonate, setIsLoadingMoreImpersonate] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Onay bypass - 1 saat boyunca onay sorma
  const IMPERSONATE_CONSENT_KEY = "impersonate_consent_until";
  const hasValidConsent = () => {
    if (typeof window === "undefined") return false;
    const consentUntil = localStorage.getItem(IMPERSONATE_CONSENT_KEY);
    if (!consentUntil) return false;
    return new Date().getTime() < parseInt(consentUntil);
  };
  const saveConsent = () => {
    // 1 saat boyunca onay sorma
    const oneHourLater = new Date().getTime() + 60 * 60 * 1000;
    localStorage.setItem(IMPERSONATE_CONSENT_KEY, oneHourLater.toString());
  };

  // Message Actions State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Media Modal State
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "image" | "video" | "audio";
    metadata?: { duration?: number };
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const impersonateMessagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createBrowserSupabaseClient());

  // ==================== EFFECTS ====================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    impersonateMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [impersonateMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        async (payload) => {
          // Yeni mesaj geldi - sender profile'ı al
          const newMsg = payload.new as Message;

          // Sender profile'ı fetch et
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, username")
            .eq("user_id", newMsg.sender_id)
            .eq("type", "real")
            .single();

          const enrichedMsg: Message = {
            ...newMsg,
            sender_profile: senderProfile || null,
            admin_profile: null
          };

          // Taklit modundaysa impersonateMessages'a ekle
          if (showImpersonate) {
            setImpersonateMessages((prev) => [...prev, enrichedMsg]);
          } else {
            setMessages((prev) => [...prev, enrichedMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, showImpersonate]);

  // ==================== CONVERSATION LIST LOGIC ====================

  const filteredConversations = conversations.filter((conv) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = conv.name?.toLowerCase().includes(searchLower);
      const matchesParticipant = conv.participants.some(
        (p) =>
          p.display_name?.toLowerCase().includes(searchLower) ||
          p.username?.toLowerCase().includes(searchLower)
      );
      if (!matchesName && !matchesParticipant) return false;
    }
    if (typeFilter !== "all" && conv.type !== typeFilter) return false;
    if (!showArchived && conv.is_archived) return false;
    return true;
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.type === "direct" && conv.participants.length > 0) {
      return conv.participants.map((p) => p.display_name || p.username || "Anonim").join(", ");
    }
    return "İsimsiz Sohbet";
  };

  // ==================== MESSAGES LOGIC ====================

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/ops/messaging/messages?conversation_id=${conversationId}`);
      if (!response.ok) throw new Error("Failed to load messages");
      const result = await response.json();
      // API "data" döndürüyor, mesajları ters çevir (en eski önce)
      const msgs = result.data || [];
      setMessages(msgs.reverse());
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Mesajlar yüklenemedi");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowImpersonate(false);
    loadMessages(conv.id);
  };

  const handleRefreshMessages = () => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  };

  // ==================== MESSAGE ACTIONS ====================

  const handleHideMessage = async (messageId: string, hide: boolean) => {
    try {
      const response = await fetch(`/api/ops/messaging/messages/${messageId}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hide })
      });
      if (!response.ok) throw new Error("Failed to update message");
      toast.success(hide ? "Mesaj gizlendi" : "Mesaj gösterildi");
      handleRefreshMessages();
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleFlagMessage = async (messageId: string, flag: boolean) => {
    try {
      const response = await fetch(`/api/ops/messaging/messages/${messageId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag })
      });
      if (!response.ok) throw new Error("Failed to update message");
      toast.success(flag ? "Mesaj işaretlendi" : "İşaret kaldırıldı");
      handleRefreshMessages();
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      const response = await fetch(`/api/ops/messaging/messages/${selectedMessage.id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete message");
      toast.success("Mesaj silindi");
      setShowDeleteDialog(false);
      setSelectedMessage(null);
      handleRefreshMessages();
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  };

  // ==================== IMPERSONATE LOGIC ====================

  // Taklit modunda mesajları yükle (20'şerli pagination)
  const loadImpersonateMessages = useCallback(
    async (conversationId: string, cursorParam?: string | null, append = false) => {
      if (!append) {
        setImpersonateMessages([]);
      }
      if (append) {
        setIsLoadingMoreImpersonate(true);
      }

      try {
        let url = `/api/ops/messaging/messages?conversation_id=${conversationId}&limit=20`;
        if (cursorParam) {
          url += `&cursor=${encodeURIComponent(cursorParam)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load messages");
        const result = await response.json();
        const msgs = (result.data || []).reverse(); // En eski önce

        if (append) {
          // Eski mesajları başa ekle
          setImpersonateMessages((prev) => [...msgs, ...prev]);
        } else {
          setImpersonateMessages(msgs);
        }

        setImpersonateHasMore(!!result.nextCursor);
        setImpersonateCursor(result.nextCursor || null);
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Mesajlar yüklenemedi");
      } finally {
        setIsLoadingMoreImpersonate(false);
      }
    },
    []
  );

  // Daha fazla mesaj yükle (yukarı kaydırma)
  const handleLoadMoreImpersonateMessages = () => {
    if (selectedConversation && impersonateCursor && !isLoadingMoreImpersonate) {
      loadImpersonateMessages(selectedConversation.id, impersonateCursor, true);
    }
  };

  // Seçili sohbetten taklit moduna geç
  const handleOpenImpersonate = () => {
    if (!selectedConversation) {
      toast.error("Önce bir sohbet seçin");
      return;
    }
    setShowImpersonate(true);
    // İlk katılımcıyı otomatik seç (sağ/sol konumlandırma için)
    if (selectedConversation.participants.length > 0) {
      setSelectedImpersonateUser(selectedConversation.participants[0]);
    } else {
      setSelectedImpersonateUser(null);
    }
    // Mesajları yükle (20'şerli)
    loadImpersonateMessages(selectedConversation.id);
  };

  // Taklit edilecek kullanıcıyı seç
  const handleSelectImpersonateUser = (user: Participant) => {
    setSelectedImpersonateUser(user);
  };

  // Mesaj gönderme isteği - onay kontrolü yapar
  const handleRequestSendMessage = () => {
    if (!selectedImpersonateUser || !selectedConversation || !pendingMessage.trim()) return;

    // Geçerli onay varsa direkt gönder
    if (hasValidConsent()) {
      handleSendImpersonatedMessage();
    } else {
      // Onay dialog'unu göster
      setShowConfirmDialog(true);
    }
  };

  // Taklit mesajı gönder (onay sonrası)
  const handleSendImpersonatedMessage = async () => {
    if (!selectedImpersonateUser || !selectedConversation || !pendingMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/ops/messaging/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: selectedImpersonateUser.user_id,
          conversation_id: selectedConversation.id,
          content: pendingMessage.trim()
        })
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Onayı kaydet (1 saat boyunca tekrar sorma)
      saveConsent();

      toast.success("Mesaj gönderildi");
      setPendingMessage("");
      setShowConfirmDialog(false);
      // Mesajları yeniden yükle
      loadImpersonateMessages(selectedConversation.id);
    } catch {
      toast.error("Mesaj gönderilemedi");
    } finally {
      setIsSending(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Sol Panel - Sohbet Listesi */}
      <Card className="w-80 flex flex-col shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sohbetler</CardTitle>
            {selectedConversation && (
              <Button
                variant={showImpersonate ? "default" : "outline"}
                size="sm"
                onClick={handleOpenImpersonate}
              >
                <Ghost className="h-4 w-4 mr-1" />
                Taklit Et
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="direct">Birebir</SelectItem>
                  <SelectItem value="group">Grup</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showArchived ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Sohbet bulunamadı
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <AvatarSmartGroup
                      users={conv.participants.slice(0, 1).map((p) => ({
                        name: p.display_name || p.username || "Anonim",
                        image: p.avatar_url || undefined,
                        gender: p.gender as "male" | "female" | "other" | undefined,
                        is_creator: p.is_creator
                      }))}
                      size={40}
                      overlap={0}
                      variant="uniform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getConversationName(conv)}</div>
                      <div className="text-xs text-muted-foreground">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                              locale: tr
                            })
                          : "Mesaj yok"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={conv.type === "group" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {conv.type === "group" ? "Grup" : "DM"}
                      </Badge>
                      {conv.is_archived && (
                        <Badge variant="secondary" className="text-xs">
                          Arşiv
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Orta/Sağ Panel - İçerik */}
      <div className="flex-1 flex gap-4">
        {/* Mesajlar veya Taklit Modu */}
        {showImpersonate && selectedConversation ? (
          // Taklit Modu - Basitleştirilmiş
          <SimplifiedImpersonatePanel
            conversation={selectedConversation}
            participants={selectedConversation.participants}
            selectedUser={selectedImpersonateUser}
            onSelectUser={handleSelectImpersonateUser}
            messages={impersonateMessages}
            messagesEndRef={impersonateMessagesEndRef}
            hasMore={impersonateHasMore}
            isLoadingMore={isLoadingMoreImpersonate}
            onLoadMore={handleLoadMoreImpersonateMessages}
            pendingMessage={pendingMessage}
            onPendingMessageChange={setPendingMessage}
            showConfirmDialog={showConfirmDialog}
            onShowConfirmDialog={setShowConfirmDialog}
            isSending={isSending}
            onRequestSend={handleRequestSendMessage}
            onConfirmSend={handleSendImpersonatedMessage}
            onClose={() => setShowImpersonate(false)}
            onMediaClick={(url, type, metadata) => {
              setSelectedMedia({ url, type, metadata });
              setMediaModalOpen(true);
            }}
          />
        ) : selectedConversation ? (
          // Conversation Detail
          <ConversationDetailPanel
            conversation={selectedConversation}
            messages={messages}
            isLoading={isLoadingMessages}
            messagesEndRef={messagesEndRef}
            onRefresh={handleRefreshMessages}
            onHideMessage={handleHideMessage}
            onFlagMessage={handleFlagMessage}
            onDeleteMessage={(msg) => {
              setSelectedMessage(msg);
              setShowDeleteDialog(true);
            }}
            onClose={() => setSelectedConversation(null)}
            onMediaClick={(url, type, metadata) => {
              setSelectedMedia({ url, type, metadata });
              setMediaModalOpen(true);
            }}
          />
        ) : (
          // Empty State
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-1">Sohbet Seçin</h3>
              <p className="text-sm">Sol panelden bir sohbet seçin</p>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mesajı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu mesaj kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Modal */}
      <MediaModal open={mediaModalOpen} onOpenChange={setMediaModalOpen} media={selectedMedia} />
    </div>
  );
}

// ==================== SUB COMPONENTS ====================

interface ConversationDetailPanelProps {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onRefresh: () => void;
  onHideMessage: (id: string, hide: boolean) => void;
  onFlagMessage: (id: string, flag: boolean) => void;
  onDeleteMessage: (msg: Message) => void;
  onClose: () => void;
  onMediaClick: (
    url: string,
    type: "image" | "video" | "audio",
    metadata?: { duration?: number }
  ) => void;
}

function ConversationDetailPanel({
  conversation,
  messages,
  isLoading,
  messagesEndRef,
  onRefresh,
  onHideMessage,
  onFlagMessage,
  onDeleteMessage,
  onClose,
  onMediaClick
}: ConversationDetailPanelProps) {
  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct" && conversation.participants.length > 0) {
      return conversation.participants
        .map((p) => p.display_name || p.username || "Anonim")
        .join(", ");
    }
    return "İsimsiz Sohbet";
  };

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarSmartGroup
              users={conversation.participants.map((p) => ({
                name: p.display_name || p.username || "Anonim",
                image: p.avatar_url || undefined,
                gender: p.gender as "male" | "female" | "other" | undefined,
                is_creator: p.is_creator
              }))}
              size={40}
              overlap={-8}
              variant="uniform"
            />
            <div>
              <CardTitle className="text-lg">{getConversationName()}</CardTitle>
              <CardDescription>
                {conversation.participants.length} katılımcı • {messages.length} mesaj
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Henüz mesaj yok</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  firstParticipantId={conversation.participants[0]?.user_id}
                  onHide={(hide) => onHideMessage(msg.id, hide)}
                  onFlag={(flag) => onFlagMessage(msg.id, flag)}
                  onDelete={() => onDeleteMessage(msg)}
                  onMediaClick={onMediaClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: Message;
  firstParticipantId?: string;
  onHide: (hide: boolean) => void;
  onFlag: (flag: boolean) => void;
  onDelete: () => void;
  onMediaClick: (
    url: string,
    type: "image" | "video" | "audio",
    metadata?: { duration?: number }
  ) => void;
}

function MessageBubble({
  message,
  firstParticipantId,
  onHide,
  onFlag,
  onDelete,
  onMediaClick
}: MessageBubbleProps) {
  // İlk katılımcının mesajları solda, diğerleri sağda
  const isFirstParticipant = message.sender_profile?.user_id === firstParticipantId;
  const senderName =
    message.sender_profile?.display_name || message.sender_profile?.username || "Anonim";

  return (
    <div
      className={`flex gap-2 ${message.is_hidden ? "opacity-50" : ""} ${
        isFirstParticipant ? "justify-start" : "justify-end"
      }`}
    >
      {/* Sol Avatar */}
      {isFirstParticipant && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
          <AvatarFallback>{senderName[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      {/* Mesaj Balonu */}
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isFirstParticipant
            ? "bg-muted text-foreground"
            : "bg-blue-500 dark:bg-blue-600 text-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2 mb-1 flex-wrap ${
            isFirstParticipant ? "" : "justify-end"
          }`}
        >
          <span className="font-medium text-xs">{senderName}</span>
          <span
            className={`text-xs ${isFirstParticipant ? "text-muted-foreground" : "text-white/70"}`}
          >
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: tr })}
          </span>
          {message.is_impersonated && (
            <Badge
              variant="outline"
              className={`text-[10px] py-0 ${
                isFirstParticipant ? "" : "border-white/50 text-white"
              }`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {message.admin_profile?.display_name || "Admin"}
            </Badge>
          )}
          {message.is_shadow && (
            <Badge variant="secondary" className="text-[10px] py-0">
              <Ghost className="h-3 w-3 mr-1" />
              Shadow
            </Badge>
          )}
          {message.is_flagged && (
            <Badge variant="destructive" className="text-[10px] py-0">
              <Flag className="h-3 w-3 mr-1" />
              Flagged
            </Badge>
          )}
        </div>

        {/* Media - Tıklanabilir Modal */}
        {message.media_url && (
          <div className="mb-2">
            {message.content_type === "image" && (
              <button
                onClick={() => onMediaClick(message.media_url!, "image")}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Image
                  src={message.media_url}
                  alt="Mesaj görseli"
                  width={250}
                  height={180}
                  className="rounded max-h-[180px] object-cover"
                />
              </button>
            )}
            {message.content_type === "video" && (
              <button
                onClick={() => onMediaClick(message.media_url!, "video")}
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
              >
                <video src={message.media_url} className="max-w-full max-h-[180px] rounded" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                  <Play className="h-10 w-10 text-white" />
                </div>
              </button>
            )}
            {message.content_type === "audio" && (
              <button
                onClick={() =>
                  onMediaClick(message.media_url!, "audio", message.media_metadata ?? undefined)
                }
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                {message.media_metadata?.duration && (
                  <span
                    className={`text-xs ${
                      isFirstParticipant ? "text-muted-foreground" : "text-white/70"
                    }`}
                  >
                    {Math.floor(message.media_metadata.duration / 60)}:
                    {String(Math.floor(message.media_metadata.duration % 60)).padStart(2, "0")}
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>

      {/* Sağ Avatar */}
      {!isFirstParticipant && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
          <AvatarFallback>{senderName[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onHide(!message.is_hidden)}>
            {message.is_hidden ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Göster
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Gizle
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFlag(!message.is_flagged)}>
            <Flag className="h-4 w-4 mr-2" />
            {message.is_flagged ? "İşareti Kaldır" : "İşaretle"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Basitleştirilmiş Taklit Paneli - Seçili sohbet üzerinden çalışır
interface SimplifiedImpersonatePanelProps {
  conversation: Conversation;
  participants: Participant[];
  selectedUser: Participant | null;
  onSelectUser: (user: Participant) => void;
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  pendingMessage: string;
  onPendingMessageChange: (value: string) => void;
  showConfirmDialog: boolean;
  onShowConfirmDialog: (show: boolean) => void;
  isSending: boolean;
  onRequestSend: () => void;
  onConfirmSend: () => void;
  onClose: () => void;
  onMediaClick: (
    url: string,
    type: "image" | "video" | "audio",
    metadata?: { duration?: number }
  ) => void;
}

function SimplifiedImpersonatePanel({
  conversation,
  participants,
  selectedUser,
  onSelectUser,
  messages,
  messagesEndRef,
  hasMore,
  isLoadingMore,
  onLoadMore,
  pendingMessage,
  onPendingMessageChange,
  showConfirmDialog,
  onShowConfirmDialog,
  isSending,
  onRequestSend,
  onConfirmSend,
  onClose,
  onMediaClick
}: SimplifiedImpersonatePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll event handler for loading more messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop < 100 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  };

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    return participants.map((p) => p.display_name || p.username || "Anonim").join(" & ");
  };

  return (
    <>
      <Card className="flex-1 flex flex-col h-full max-h-[calc(100vh-200px)]">
        {/* Header - Kompakt */}
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            {/* Sol - Sohbet Bilgisi */}
            <div className="flex items-center gap-3">
              <AvatarSmartGroup
                users={participants.map((p) => ({
                  name: p.display_name || p.username || "Anonim",
                  image: p.avatar_url || undefined,
                  gender: p.gender as "male" | "female" | "other" | undefined,
                  is_creator: p.is_creator
                }))}
                size={32}
                overlap={-8}
                variant="uniform"
              />
              <div>
                <CardTitle className="text-sm font-medium">{getConversationName()}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 border-orange-500 text-orange-600 dark:text-orange-400"
                  >
                    <Ghost className="h-3 w-3 mr-1" />
                    Taklit Modu
                  </Badge>
                  {selectedUser && (
                    <span className="text-xs text-muted-foreground">
                      {selectedUser.display_name || selectedUser.username} olarak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ - Kullanıcı Seçimi + Kapat */}
            <div className="flex items-center gap-3">
              {/* Kullanıcı Seçimi */}
              <div className="flex items-center gap-1.5 bg-muted rounded-full p-1">
                {participants.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => onSelectUser(user)}
                    title={user.display_name || user.username || "Kullanıcı"}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all text-xs ${
                      selectedUser?.user_id === user.user_id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(user.display_name || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium max-w-[80px] truncate">
                      {user.display_name || user.username}
                    </span>
                  </button>
                ))}
              </div>

              {/* Kapat Butonu */}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Mesajlar */}
        <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
          <div ref={scrollRef} className="h-full overflow-y-auto p-4" onScroll={handleScroll}>
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mb-4">
                <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? "Yükleniyor..." : "Daha Eski Mesajlar"}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg) => {
                // Seçili kullanıcının mesajları sağda, diğerleri solda
                const isTargetUser =
                  selectedUser && msg.sender_profile?.user_id === selectedUser.user_id;
                const senderName =
                  msg.sender_profile?.display_name || msg.sender_profile?.username || "Anonim";

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isTargetUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isTargetUser && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>{senderName[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isTargetUser ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {!isTargetUser && (
                        <div className="text-xs font-medium mb-1 opacity-70">{senderName}</div>
                      )}

                      {/* Media - Tıklanabilir */}
                      {msg.media_url && (
                        <div className="mb-2">
                          {msg.content_type === "image" && (
                            <button
                              onClick={() => onMediaClick(msg.media_url!, "image")}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={msg.media_url}
                                alt="Mesaj görseli"
                                width={200}
                                height={150}
                                className="rounded max-h-[150px] w-auto object-cover"
                              />
                            </button>
                          )}
                          {msg.content_type === "video" && (
                            <button
                              onClick={() => onMediaClick(msg.media_url!, "video")}
                              className="relative cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <video
                                src={msg.media_url}
                                className="max-w-full max-h-[150px] rounded"
                                muted
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                                <Play className="h-10 w-10 text-white" />
                              </div>
                            </button>
                          )}
                          {msg.content_type === "audio" && (
                            <button
                              onClick={() =>
                                onMediaClick(
                                  msg.media_url!,
                                  "audio",
                                  msg.media_metadata ?? undefined
                                )
                              }
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Volume2 className="h-5 w-5 text-primary" />
                              </div>
                              {msg.media_metadata?.duration && (
                                <span className="text-xs opacity-70">
                                  {Math.floor(msg.media_metadata.duration / 60)}:
                                  {String(Math.floor(msg.media_metadata.duration % 60)).padStart(
                                    2,
                                    "0"
                                  )}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </span>
                        {msg.is_impersonated && (
                          <Badge variant="outline" className="text-xs py-0 px-1">
                            <Shield className="h-3 w-3 mr-1" />
                            {msg.admin_profile?.display_name || "Admin"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isTargetUser && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>{senderName[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </CardContent>

        {/* Mesaj Gönderme */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder={
                selectedUser
                  ? `${selectedUser.display_name || selectedUser.username} olarak mesaj yazın...`
                  : "Önce taklit edilecek kullanıcıyı seçin"
              }
              value={pendingMessage}
              onChange={(e) => onPendingMessageChange(e.target.value)}
              className="min-h-[50px] resize-none text-sm"
              disabled={!selectedUser}
            />
            <Button
              onClick={onRequestSend}
              disabled={!pendingMessage.trim() || !selectedUser}
              size="icon"
              className="shrink-0 h-[50px] w-[50px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={onShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Mesaj Gönderimi Onayı
            </DialogTitle>
            <DialogDescription>
              <strong>{selectedUser?.display_name || selectedUser?.username}</strong> adına mesaj
              göndereceksiniz. Bu işlem geri alınamaz ve audit log&apos;a kaydedilir.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-3 my-4">
            <p className="text-sm whitespace-pre-wrap">{pendingMessage}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onShowConfirmDialog(false)}>
              İptal
            </Button>
            <Button onClick={onConfirmSend} disabled={isSending}>
              {isSending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== MEDIA MODAL ====================

interface MediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    url: string;
    type: "image" | "video" | "audio";
    metadata?: { duration?: number };
  } | null;
}

function MediaModal({ open, onOpenChange, media }: MediaModalProps) {
  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative flex items-center justify-center bg-black min-h-[300px]">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Download Button */}
          <a
            href={media.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 left-2 z-10"
          >
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Download className="h-5 w-5" />
            </Button>
          </a>

          {/* Media Content */}
          {media.type === "image" && (
            <img src={media.url} alt="Medya" className="max-w-full max-h-[80vh] object-contain" />
          )}

          {media.type === "video" && (
            <video src={media.url} controls autoPlay className="max-w-full max-h-[80vh]" />
          )}

          {media.type === "audio" && (
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <Volume2 className="h-12 w-12 text-primary" />
              </div>
              <audio src={media.url} controls autoPlay className="w-full max-w-md" />
              {media.metadata?.duration && (
                <span className="text-white/70 text-sm">
                  Süre: {Math.floor(media.metadata.duration / 60)}:
                  {String(Math.floor(media.metadata.duration % 60)).padStart(2, "0")}
                </span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
