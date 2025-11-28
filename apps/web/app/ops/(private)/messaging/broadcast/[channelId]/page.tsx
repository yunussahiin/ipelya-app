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
  Radio,
  MoreVertical,
  Flag,
  EyeOff,
  Eye,
  Trash2,
  Pin,
  RefreshCw,
  MessageSquare,
  Lock,
  Globe,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified?: boolean;
}

interface BroadcastMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  content_type: string;
  media_url: string | null;
  poll_data: Record<string, unknown> | null;
  reaction_counts: Record<string, number> | null;
  is_pinned: boolean;
  is_deleted: boolean;
  is_hidden?: boolean;
  is_flagged?: boolean;
  created_at: string;
  sender_profile: UserProfile | null;
}

interface BroadcastChannel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  access_type: string;
  member_count: number;
  message_count: number;
  is_active: boolean;
  created_at: string;
  creator_profile: UserProfile | null;
}

const ACCESS_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  public: { label: "Herkese Açık", icon: <Globe className="h-4 w-4" /> },
  subscribers_only: { label: "Abonelere Özel", icon: <Lock className="h-4 w-4" /> },
  paid: { label: "Ücretli", icon: <Crown className="h-4 w-4" /> }
};

export default function BroadcastChannelDetailPage() {
  const params = useParams();
  const channelId = params.channelId as string;

  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<BroadcastMessage | null>(null);
  const [moderationAction, setModerationAction] = useState<string | null>(null);
  const [showModerationDialog, setShowModerationDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Channel bilgilerini yükle
  const loadChannel = useCallback(async () => {
    try {
      const response = await fetch(`/api/ops/messaging/broadcast/channels`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      const ch = result.data?.find((c: BroadcastChannel) => c.id === channelId);
      if (ch) {
        setChannel(ch);
      }
    } catch (error) {
      console.error("Load channel error:", error);
      toast.error("Kanal bilgileri yüklenemedi");
    }
  }, [channelId]);

  // Mesajları yükle
  const loadMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/ops/messaging/broadcast/messages?channel_id=${channelId}&limit=100`
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
  }, [channelId]);

  // İlk yükleme
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadChannel(), loadMessages()]);
      setIsLoading(false);
    };
    load();
  }, [loadChannel, loadMessages]);

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
          message_type: "broadcast",
          action: moderationAction
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success(
        `Mesaj ${moderationAction === "hide" ? "gizlendi" : moderationAction === "unhide" ? "gösterildi" : moderationAction === "flag" ? "işaretlendi" : moderationAction === "unflag" ? "işaret kaldırıldı" : "silindi"}`
      );

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

  const accessInfo =
    ACCESS_TYPE_LABELS[channel?.access_type || "public"] || ACCESS_TYPE_LABELS.public;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ops/messaging/broadcast">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={channel?.avatar_url || undefined} />
              <AvatarFallback>
                <Radio className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{channel?.name || "Yükleniyor..."}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  {accessInfo.icon}
                  {accessInfo.label}
                </Badge>
                <span>•</span>
                <span>{channel?.member_count || 0} üye</span>
                {!channel?.is_active && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary">Pasif</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={loadMessages} disabled={isLoadingMessages}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMessages ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Messages */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Yayın Mesajları
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
                          {msg.is_pinned && (
                            <Badge variant="outline" className="text-xs">
                              <Pin className="h-3 w-3 mr-1" />
                              Sabitlenmiş
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

                        {/* Content */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-sm whitespace-pre-wrap ${msg.is_deleted ? "italic text-muted-foreground" : ""}`}
                            >
                              {msg.is_deleted ? "Bu mesaj silindi" : msg.content}
                            </p>

                            {/* Poll */}
                            {msg.poll_data && (
                              <div className="mt-2 p-3 rounded-lg bg-muted">
                                <p className="text-sm font-medium">📊 Anket</p>
                                <p className="text-xs text-muted-foreground">
                                  {JSON.stringify(msg.poll_data)}
                                </p>
                              </div>
                            )}

                            {/* Reactions */}
                            {msg.reaction_counts && Object.keys(msg.reaction_counts).length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {Object.entries(msg.reaction_counts).map(([emoji, count]) => (
                                  <Badge key={emoji} variant="secondary" className="text-xs">
                                    {emoji} {count}
                                  </Badge>
                                ))}
                              </div>
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

        {/* Sidebar - Channel Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Kanal Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Creator */}
            {channel?.creator_profile && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Oluşturan</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={channel.creator_profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {(channel.creator_profile.display_name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">
                      {channel.creator_profile.display_name || channel.creator_profile.username}
                    </div>
                    {channel.creator_profile.username && (
                      <div className="text-xs text-muted-foreground">
                        @{channel.creator_profile.username}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            {channel?.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Açıklama</p>
                <p className="text-sm">{channel.description}</p>
              </div>
            )}

            <Separator />

            {/* Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Üye Sayısı</span>
                <span className="font-medium">{channel?.member_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mesaj Sayısı</span>
                <span className="font-medium">{channel?.message_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oluşturulma</span>
                <span>
                  {channel?.created_at
                    ? format(new Date(channel.created_at), "dd MMM yyyy", { locale: tr })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durum</span>
                <Badge variant={channel?.is_active ? "default" : "secondary"}>
                  {channel?.is_active ? "Aktif" : "Pasif"}
                </Badge>
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
