"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Users,
  User,
  MoreVertical,
  Flag,
  EyeOff,
  Eye,
  Trash2,
  Ghost,
  Shield,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_creator?: boolean;
  is_verified?: boolean;
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
  sender_profile: UserProfile | null;
  admin_profile: UserProfile | null;
  reply_to?: {
    id: string;
    content: string;
    sender_profile: UserProfile | null;
  } | null;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  created_at: string;
  is_archived: boolean;
  participants: Array<{
    user_id: string;
    profile: UserProfile;
  }>;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [moderationAction, setModerationAction] = useState<string | null>(null);
  const [showModerationDialog, setShowModerationDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversation bilgilerini yükle
  const loadConversation = useCallback(async () => {
    try {
      // API'den conversation detaylarını al
      const response = await fetch(
        `/api/ops/messaging/conversations?conversation_id=${conversationId}`
      );
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // İlk conversation'ı al (filtrelenmiş)
      const conv = result.data?.find((c: Conversation) => c.id === conversationId);
      if (conv) {
        setConversation(conv);
      }
    } catch (error) {
      console.error("Load conversation error:", error);
      toast.error("Sohbet bilgileri yüklenemedi");
    }
  }, [conversationId]);

  // Mesajları yükle
  const loadMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/ops/messaging/messages?conversation_id=${conversationId}&limit=100`
      );
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setMessages((result.data || []).reverse());
    } catch (error) {
      console.error("Load messages error:", error);
      toast.error("Mesajlar yüklenemedi");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationId]);

  // İlk yükleme
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadConversation(), loadMessages()]);
      setIsLoading(false);
    };
    load();
  }, [loadConversation, loadMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Moderasyon işlemi
  const handleModeration = async () => {
    if (!selectedMessage || !moderationAction) return;

    try {
      const response = await fetch("/api/ops/messaging/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: selectedMessage.id,
          message_type: "dm",
          action: moderationAction
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success(
        `Mesaj ${moderationAction === "hide" ? "gizlendi" : moderationAction === "unhide" ? "gösterildi" : moderationAction === "flag" ? "işaretlendi" : moderationAction === "unflag" ? "işaret kaldırıldı" : "silindi"}`
      );

      // Mesajları yenile
      loadMessages();
    } catch (error) {
      console.error("Moderation error:", error);
      toast.error("İşlem başarısız");
    } finally {
      setShowModerationDialog(false);
      setSelectedMessage(null);
      setModerationAction(null);
    }
  };

  // Conversation adını al
  const getConversationName = () => {
    if (!conversation) return "Yükleniyor...";
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct" && conversation.participants?.length > 0) {
      return conversation.participants
        .map((p) => p.profile?.display_name || p.profile?.username || "Anonim")
        .join(", ");
    }
    return "İsimsiz Sohbet";
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/messaging/conversations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation?.avatar_url || undefined} />
              <AvatarFallback>
                {conversation?.type === "group" ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{getConversationName()}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={conversation?.type === "group" ? "default" : "outline"}>
                  {conversation?.type === "group" ? "Grup" : "Birebir"}
                </Badge>
                <span>•</span>
                <span>{conversation?.participants?.length || 0} katılımcı</span>
                {conversation?.is_archived && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">Arşivlenmiş</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadMessages} disabled={isLoadingMessages}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMessages ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Link
            href={`/ops/messaging/impersonate?user=${conversation?.participants?.[0]?.user_id}`}
          >
            <Button variant="outline">
              <Ghost className="h-4 w-4 mr-2" />
              Impersonate
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Messages */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mesajlar
            </CardTitle>
            <CardDescription>{messages.length} mesaj</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Mesaj bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.is_hidden ? "opacity-50" : ""} ${msg.is_deleted ? "opacity-30" : ""}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(msg.sender_profile?.display_name || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {msg.sender_profile?.display_name ||
                              msg.sender_profile?.username ||
                              "Anonim"}
                          </span>
                          {msg.is_shadow && (
                            <Badge variant="outline" className="text-xs">
                              <Ghost className="h-3 w-3 mr-1" />
                              Shadow
                            </Badge>
                          )}
                          {msg.is_impersonated && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {msg.is_flagged && (
                            <Badge variant="destructive" className="text-xs">
                              <Flag className="h-3 w-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                          {msg.is_hidden && (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Gizli
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                              locale: tr
                            })}
                          </span>
                        </div>

                        {/* Reply */}
                        {msg.reply_to && (
                          <div className="mb-2 p-2 rounded bg-muted text-sm border-l-2 border-primary">
                            <span className="font-medium">
                              {msg.reply_to.sender_profile?.display_name || "Anonim"}:
                            </span>{" "}
                            <span className="text-muted-foreground">{msg.reply_to.content}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {msg.is_deleted ? (
                              <p className="text-sm italic text-muted-foreground">
                                Bu mesaj silindi
                              </p>
                            ) : (
                              <>
                                {/* Media Content */}
                                {msg.media_url && (
                                  <div className="mb-2">
                                    {msg.content_type === "image" && (
                                      <a
                                        href={msg.media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Image
                                          src={msg.media_url}
                                          alt="Mesaj görseli"
                                          width={300}
                                          height={300}
                                          className="max-w-[300px] max-h-[300px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          unoptimized
                                        />
                                      </a>
                                    )}
                                    {msg.content_type === "video" && (
                                      <video
                                        src={msg.media_url}
                                        controls
                                        className="max-w-[300px] max-h-[300px] rounded-lg"
                                      />
                                    )}
                                    {msg.content_type === "audio" && (
                                      <div className="flex items-center gap-2">
                                        <audio
                                          src={msg.media_url}
                                          controls
                                          className="max-w-[250px]"
                                        />
                                        {msg.media_metadata?.duration && (
                                          <span className="text-xs text-muted-foreground">
                                            {Math.floor(msg.media_metadata.duration / 60)}:
                                            {String(
                                              Math.floor(msg.media_metadata.duration % 60)
                                            ).padStart(2, "0")}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {msg.content_type === "file" && (
                                      <a
                                        href={msg.media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                                      >
                                        <span className="text-sm">📎 Dosya İndir</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {/* Text Content */}
                                {msg.content && (
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          {!msg.is_deleted && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {msg.is_hidden ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedMessage(msg);
                                      setModerationAction("unhide");
                                      setShowModerationDialog(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Göster
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedMessage(msg);
                                      setModerationAction("hide");
                                      setShowModerationDialog(true);
                                    }}
                                  >
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Gizle
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {msg.is_flagged ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedMessage(msg);
                                      setModerationAction("unflag");
                                      setShowModerationDialog(true);
                                    }}
                                  >
                                    <Flag className="h-4 w-4 mr-2" />
                                    İşareti Kaldır
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedMessage(msg);
                                      setModerationAction("flag");
                                      setShowModerationDialog(true);
                                    }}
                                  >
                                    <Flag className="h-4 w-4 mr-2" />
                                    İşaretle
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedMessage(msg);
                                    setModerationAction("delete");
                                    setShowModerationDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sidebar - Participants */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Katılımcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversation?.participants?.map((p) => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(p.profile?.display_name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {p.profile?.display_name || p.profile?.username || "Anonim"}
                    </div>
                    {p.profile?.username && (
                      <div className="text-xs text-muted-foreground truncate">
                        @{p.profile.username}
                      </div>
                    )}
                  </div>
                  <Link href={`/ops/messaging/impersonate?user=${p.user_id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Ghost className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oluşturulma</span>
                <span>
                  {conversation?.created_at
                    ? format(new Date(conversation.created_at), "dd MMM yyyy", { locale: tr })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Son Mesaj</span>
                <span>
                  {conversation?.last_message_at
                    ? formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: tr
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Dialog */}
      <AlertDialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moderationAction === "delete"
                ? "Mesajı Sil"
                : moderationAction === "hide"
                  ? "Mesajı Gizle"
                  : moderationAction === "unhide"
                    ? "Mesajı Göster"
                    : moderationAction === "flag"
                      ? "Mesajı İşaretle"
                      : "İşareti Kaldır"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {moderationAction === "delete"
                ? "Bu mesaj kalıcı olarak silinecek. Bu işlem geri alınamaz."
                : moderationAction === "hide"
                  ? "Bu mesaj kullanıcılardan gizlenecek."
                  : moderationAction === "unhide"
                    ? "Bu mesaj tekrar görünür olacak."
                    : moderationAction === "flag"
                      ? "Bu mesaj inceleme için işaretlenecek."
                      : "Bu mesajın işareti kaldırılacak."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedMessage && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">
                {selectedMessage.sender_profile?.display_name || "Anonim"}:
              </p>
              <p className="text-muted-foreground">{selectedMessage.content}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleModeration}
              className={
                moderationAction === "delete" ? "bg-destructive hover:bg-destructive/90" : ""
              }
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
