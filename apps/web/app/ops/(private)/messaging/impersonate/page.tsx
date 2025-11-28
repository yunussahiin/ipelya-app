"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  User,
  MessageSquare,
  Send,
  ArrowLeft,
  Ghost,
  Shield,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_creator: boolean;
  is_verified: boolean;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  unread_count: number;
  other_participant: UserProfile | null;
  last_message: {
    content: string;
    content_type: string;
    is_mine: boolean;
    created_at: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  content_type: string;
  media_url: string | null;
  media_metadata: { duration?: number } | null;
  sender_id: string;
  sender_profile: UserProfile | null;
  is_impersonated: boolean;
  admin_profile: UserProfile | null;
  created_at: string;
}

export default function ImpersonatePage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<(UserProfile & { conversation_count?: number })[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sayfa yüklendiğinde sohbeti olan kullanıcıları getir
  const loadUsersWithConversations = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/ops/messaging/users/with-conversations");
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);
      setAllUsers(result.data || []);
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Sayfa açıldığında kullanıcıları yükle
  useEffect(() => {
    loadUsersWithConversations();
  }, [loadUsersWithConversations]);

  // Filtrelenmiş kullanıcılar (arama)
  const filteredUsers = allUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  // Kullanıcı seçildiğinde sohbetleri yükle
  const loadUserConversations = useCallback(async (userId: string) => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`/api/ops/messaging/users/${userId}/conversations`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setConversations(result.data.conversations || []);
    } catch (error) {
      console.error("Load conversations error:", error);
      toast.error("Sohbetler yüklenirken hata oluştu");
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Sohbet seçildiğinde mesajları yükle
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/ops/messaging/messages?conversation_id=${conversationId}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setMessages((result.data || []).reverse());
    } catch (error) {
      console.error("Load messages error:", error);
      toast.error("Mesajlar yüklenirken hata oluştu");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Kullanıcı seçimi
  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedConversation(null);
    setMessages([]);
    loadUserConversations(user.user_id);
  };

  // Sohbet seçimi
  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  };

  // Mesaj gönder (onay sonrası)
  const sendImpersonatedMessage = async () => {
    if (!selectedUser || !selectedConversation || !pendingMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/ops/messaging/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: selectedUser.user_id,
          conversation_id: selectedConversation.id,
          content: pendingMessage.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success("Mesaj gönderildi (kullanıcı adına)");
      setNewMessage("");
      setPendingMessage("");
      setShowWarningDialog(false);

      // Mesajları yeniden yükle
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Mesaj gönderilemedi");
    } finally {
      setIsSending(false);
    }
  };

  // Mesaj gönderme öncesi onay
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setPendingMessage(newMessage.trim());
    setShowWarningDialog(true);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Ghost className="h-8 w-8" />
            Kullanıcı Olarak Mesaj
          </h1>
          <p className="text-muted-foreground">Bir kullanıcı seçin ve onun adına mesaj gönderin</p>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
          <div className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Dikkat:</strong> Bu özellik kullanıcı adına mesaj göndermenizi sağlar. Tüm
            işlemler audit log&apos;a kaydedilir. Sadece meşru amaçlar için kullanın.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sol Panel - Kullanıcı Seçimi */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Kullanıcı Seç</CardTitle>
            <CardDescription>
              Sohbeti olan kullanıcılar ({allUsers.length} kullanıcı)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User List */}
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "Kullanıcı bulunamadı" : "Sohbeti olan kullanıcı yok"}
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left ${
                        selectedUser?.user_id === user.user_id ? "bg-accent" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.display_name || user.username || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {user.display_name || user.username}
                        </div>
                        <div className="flex items-center gap-2">
                          {user.username && (
                            <span className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            • {user.conversation_count} sohbet
                          </span>
                        </div>
                      </div>
                      {user.is_creator && (
                        <Badge variant="secondary" className="shrink-0">
                          Creator
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Orta Panel - Sohbetler */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Sohbetler</CardTitle>
            <CardDescription>
              {selectedUser
                ? `${selectedUser.display_name || selectedUser.username}'in sohbetleri`
                : "Önce bir kullanıcı seçin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Kullanıcı seçilmedi</p>
              </div>
            ) : isLoadingConversations ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p>Yükleniyor...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sohbet bulunamadı</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationSelect(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selectedConversation?.id === conv.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conv.avatar_url || conv.other_participant?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {(conv.name ||
                            conv.other_participant?.display_name ||
                            "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {conv.name ||
                            conv.other_participant?.display_name ||
                            conv.other_participant?.username ||
                            "Bilinmeyen"}
                        </div>
                        {conv.last_message && (
                          <div className="text-sm text-muted-foreground truncate">
                            {conv.last_message.is_mine ? "Sen: " : ""}
                            {conv.last_message.content}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Sağ Panel - Mesajlar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mesajlar</CardTitle>
                <CardDescription>
                  {selectedConversation
                    ? `${selectedConversation.name || selectedConversation.other_participant?.display_name || "Sohbet"}`
                    : "Bir sohbet seçin"}
                </CardDescription>
              </div>
              {selectedConversation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Geri
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-[450px]">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sohbet seçilmedi</p>
                </div>
              </div>
            ) : isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isTargetUser = msg.sender_id === selectedUser?.user_id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isTargetUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isTargetUser ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            {!isTargetUser && (
                              <div className="text-xs font-medium mb-1 opacity-70">
                                {msg.sender_profile?.display_name || msg.sender_profile?.username}
                              </div>
                            )}

                            {/* Media Content */}
                            {msg.media_url && (
                              <div className="mb-2">
                                {msg.content_type === "image" && (
                                  <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={msg.media_url}
                                      alt="Mesaj görseli"
                                      className="max-w-full max-h-[200px] rounded object-cover"
                                    />
                                  </a>
                                )}
                                {msg.content_type === "video" && (
                                  <video
                                    src={msg.media_url}
                                    controls
                                    className="max-w-full max-h-[200px] rounded"
                                  />
                                )}
                                {msg.content_type === "audio" && (
                                  <div className="flex items-center gap-2">
                                    <audio
                                      src={msg.media_url}
                                      controls
                                      className="max-w-full h-8"
                                    />
                                    {msg.media_metadata?.duration && (
                                      <span className="text-xs opacity-70">
                                        {Math.floor(msg.media_metadata.duration / 60)}:
                                        {String(
                                          Math.floor(msg.media_metadata.duration % 60)
                                        ).padStart(2, "0")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Text Content */}
                            {msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
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
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={`${selectedUser?.display_name || selectedUser?.username} olarak mesaj yaz...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Bu mesaj <strong>{selectedUser?.display_name || selectedUser?.username}</strong>{" "}
                    adına gönderilecek
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Mesaj Gönderme Onayı
            </DialogTitle>
            <DialogDescription>
              Bu mesaj <strong>{selectedUser?.display_name || selectedUser?.username}</strong> adına
              gönderilecek. Bu işlem geri alınamaz ve audit log&apos;a kaydedilecektir.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-1">Gönderilecek mesaj:</p>
            <p className="text-sm text-muted-foreground">{pendingMessage}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowWarningDialog(false);
                setPendingMessage("");
              }}
            >
              İptal
            </Button>
            <Button
              onClick={sendImpersonatedMessage}
              disabled={isSending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSending ? "Gönderiliyor..." : "Onayla ve Gönder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
