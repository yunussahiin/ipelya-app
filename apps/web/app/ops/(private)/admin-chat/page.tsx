"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Users,
  User,
  Loader2,
  X,
  CheckCheck,
  Reply,
  Shield
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  role?: string; // admin, super_admin, moderator
}

interface OpsConversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  last_message_at: string | null;
  created_at: string;
  participants: {
    admin_id: string;
    admin: AdminProfile | null;
  }[];
  unread_count: number;
}

interface ReplyTo {
  id: string;
  content: string;
  sender_name: string;
}

interface OpsMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: string;
  created_at: string;
  sender: AdminProfile | null;
  reply_to_id?: string | null;
  reply_to?: ReplyTo | null;
  read_by?: string[]; // Okuyan kullanıcı ID'leri
}

export default function AdminChatPage() {
  const supabase = createBrowserSupabaseClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<OpsConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<OpsConversation | null>(null);
  const [messages, setMessages] = useState<OpsMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchAdmin, setSearchAdmin] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<OpsMessage | null>(null);

  // Grup oluşturma state'leri
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Current user'ı al
  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    getCurrentUser();
  }, [supabase.auth]);

  // Conversations'ı yükle
  useEffect(() => {
    async function loadConversations() {
      if (!currentUserId) return;

      console.log("[AdminChat] Loading conversations for user:", currentUserId);
      setIsLoading(true);
      try {
        // Katıldığım sohbetleri al
        const { data: participations, error: partError } = await supabase
          .from("ops_conversation_participants")
          .select(
            `
            conversation_id,
            unread_count,
            conversation:ops_conversations (
              id,
              type,
              name,
              avatar_url,
              last_message_at,
              created_at
            )
          `
          )
          .eq("admin_id", currentUserId)
          .is("left_at", null);

        if (partError) {
          console.error("[AdminChat] Error loading participations:", partError);
          toast.error(`Sohbetler yüklenemedi: ${partError.message}`);
          setConversations([]);
          return;
        }

        console.log("[AdminChat] Loaded participations:", participations?.length || 0);

        if (!participations || participations.length === 0) {
          console.log("[AdminChat] No participations found");
          setConversations([]);
          return;
        }

        // Her conversation için katılımcıları al
        const conversationIds = participations.map((p) => p.conversation_id);

        console.log("[AdminChat] Fetching participants for conversations:", conversationIds);

        const { data: allParticipants, error: partError2 } = await supabase
          .from("ops_conversation_participants")
          .select("conversation_id, admin_id")
          .in("conversation_id", conversationIds)
          .is("left_at", null);

        console.log(
          "[AdminChat] Loaded participants:",
          allParticipants?.length || 0,
          partError2?.message || "no error"
        );

        // Katılımcı ID'lerini al
        const adminIds = [...new Set((allParticipants || []).map((ap) => ap.admin_id))];
        console.log("[AdminChat] Fetching admin profiles for IDs:", adminIds);

        // Admin bilgilerini profiles tablosundan al (sadece real profiller)
        const { data: adminProfiles, error: adminError } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, role")
          .in("user_id", adminIds)
          .eq("type", "real");

        console.log(
          "[AdminChat] Loaded admin profiles:",
          adminProfiles?.length || 0,
          adminError?.message || "no error"
        );

        // Admin map oluştur
        const adminMap: Record<string, AdminProfile> = {};
        (adminProfiles || []).forEach((ap) => {
          adminMap[ap.user_id] = {
            id: ap.user_id,
            full_name: ap.display_name || ap.username,
            email: null,
            is_active: true,
            avatar_url: ap.avatar_url,
            role: ap.role || "admin"
          };
        });

        // Conversations'ları oluştur
        const convs: OpsConversation[] = participations
          .filter((p) => p.conversation) // conversation null olabilir
          .map((p) => {
            // Supabase join array döndürür, ilk elemanı al
            const convData = Array.isArray(p.conversation) ? p.conversation[0] : p.conversation;

            const conv = convData as {
              id: string;
              type: "direct" | "group";
              name: string | null;
              avatar_url: string | null;
              last_message_at: string | null;
              created_at: string;
            };
            const participants =
              allParticipants
                ?.filter((ap) => ap.conversation_id === p.conversation_id)
                .map((ap) => ({
                  admin_id: ap.admin_id,
                  admin: adminMap[ap.admin_id] || null
                })) || [];

            return {
              ...conv,
              participants,
              unread_count: p.unread_count || 0
            };
          });

        // Son mesaja göre sırala
        convs.sort((a, b) => {
          if (!a.last_message_at) return 1;
          if (!b.last_message_at) return -1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

        setConversations(convs);
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast.error("Sohbetler yüklenirken hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, [currentUserId, supabase]);

  // Mesajları yükle
  useEffect(() => {
    async function loadMessages() {
      if (!activeConversation) {
        setMessages([]);
        return;
      }

      try {
        console.log("[AdminChat] Loading messages for conversation:", activeConversation.id);

        const { data, error: msgError } = await supabase
          .from("ops_messages")
          .select(
            `
            id,
            conversation_id,
            sender_id,
            content,
            content_type,
            created_at,
            is_deleted,
            reply_to_id
          `
          )
          .eq("conversation_id", activeConversation.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true });

        console.log(
          "[AdminChat] Loaded messages:",
          data?.length || 0,
          msgError?.message || "no error"
        );

        if (!data) {
          setMessages([]);
          return;
        }

        // Sender bilgilerini profiles tablosundan al (sadece real profiller)
        const senderIds = [...new Set(data.map((m) => m.sender_id))];
        console.log("[AdminChat] Fetching sender info for IDs:", senderIds);

        const { data: senders, error: sendersError } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, role")
          .in("user_id", senderIds)
          .eq("type", "real");

        console.log(
          "[AdminChat] Loaded senders:",
          senders?.length || 0,
          sendersError?.message || "no error"
        );

        // Sender map oluştur
        const senderMap: Record<string, AdminProfile> = {};
        (senders || []).forEach((s) => {
          senderMap[s.user_id] = {
            id: s.user_id,
            full_name: s.display_name || s.username,
            email: null,
            is_active: true,
            avatar_url: s.avatar_url,
            role: s.role || "admin"
          };
        });

        // Reply mesajlarını al
        const replyToIds = data.filter((m) => m.reply_to_id).map((m) => m.reply_to_id);
        const replyToMap: Record<string, { id: string; content: string; sender_name: string }> = {};

        if (replyToIds.length > 0) {
          const { data: replyMessages } = await supabase
            .from("ops_messages")
            .select("id, content, sender_id")
            .in("id", replyToIds);

          if (replyMessages) {
            replyMessages.forEach((rm) => {
              const sender = senderMap[rm.sender_id];
              replyToMap[rm.id] = {
                id: rm.id,
                content: rm.content,
                sender_name: sender?.full_name || "Anonim"
              };
            });
          }
        }

        // Mesajlara sender ve reply_to bilgisini ekle
        const messagesWithSender = data.map((m) => ({
          ...m,
          sender: senderMap[m.sender_id] || null,
          reply_to: m.reply_to_id ? replyToMap[m.reply_to_id] || null : null
        }));

        console.log("[AdminChat] Messages with sender info:", messagesWithSender);
        setMessages(messagesWithSender);

        // Okunmamış sayısını sıfırla
        if (currentUserId) {
          await supabase
            .from("ops_conversation_participants")
            .update({ unread_count: 0, last_read_at: new Date().toISOString() })
            .eq("conversation_id", activeConversation.id)
            .eq("admin_id", currentUserId);
        }

        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("[AdminChat] Error loading messages:", error);
      }
    }

    loadMessages();
  }, [activeConversation, currentUserId, supabase, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`ops:messages:${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ops_messages",
          filter: `conversation_id=eq.${activeConversation.id}`
        },
        async (payload) => {
          // Sender bilgisini profiles tablosundan al (sadece real profil)
          console.log("[AdminChat] New message received:", payload.new);

          const { data: sender } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, avatar_url, role")
            .eq("user_id", payload.new.sender_id)
            .eq("type", "real")
            .single();

          console.log("[AdminChat] Sender info:", sender);

          const newMsg: OpsMessage = {
            ...(payload.new as OpsMessage),
            sender: sender
              ? {
                  id: sender.user_id,
                  full_name: sender.display_name || sender.username,
                  email: null,
                  is_active: true,
                  avatar_url: sender.avatar_url,
                  role: sender.role || "admin"
                }
              : null
          };

          console.log("[AdminChat] Message with sender:", newMsg);
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeConversation, supabase, scrollToBottom]);

  // Admin listesini yükle (profiles tablosundan role=admin VE type=real olanları al)
  useEffect(() => {
    async function loadAdmins() {
      console.log("[AdminChat] Loading admin list from profiles...");

      // profiles tablosundan role=admin VE type=real olanları al
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .eq("role", "admin")
        .eq("type", "real");

      if (profilesError) {
        console.error("[AdminChat] Error loading admins from profiles:", profilesError);
        return;
      }

      console.log(
        "[AdminChat] Loaded admins from profiles:",
        profilesData?.length || 0,
        profilesData
      );

      // AdminProfile formatına dönüştür (avatar_url ekle)
      const adminsFormatted: AdminProfile[] = (profilesData || []).map((p) => ({
        id: p.user_id,
        full_name: p.display_name || p.username,
        email: null,
        is_active: true,
        avatar_url: p.avatar_url
      }));

      setAdmins(adminsFormatted);
    }

    loadAdmins();
  }, [supabase]);

  // Mesaj gönder (reply desteği ile)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUserId) return;

    console.log("[AdminChat] Sending message:", {
      conversationId: activeConversation.id,
      senderId: currentUserId,
      content: newMessage.trim(),
      contentType: "text",
      replyToId: replyTo?.id || null
    });

    setIsSending(true);
    try {
      const messageData: {
        conversation_id: string;
        sender_id: string;
        content: string;
        content_type: string;
        reply_to_id?: string;
      } = {
        conversation_id: activeConversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        content_type: "text"
      };

      // Reply varsa ekle
      if (replyTo) {
        messageData.reply_to_id = replyTo.id;
      }

      console.log("[AdminChat] Message data to insert:", messageData);

      const { data, error } = await supabase.from("ops_messages").insert(messageData).select();

      console.log("[AdminChat] Insert response:", { data, error });

      if (error) throw error;

      console.log("[AdminChat] Message sent successfully:", data);
      setNewMessage("");
      setReplyTo(null); // Reply'ı temizle
    } catch (error) {
      console.error("[AdminChat] Error sending message:", error);
      toast.error("Mesaj gönderilemedi");
    } finally {
      setIsSending(false);
    }
  };

  // Yeni sohbet başlat
  const handleStartChat = async (adminId: string) => {
    if (!currentUserId || adminId === currentUserId) return;

    try {
      // Mevcut direct sohbet var mı kontrol et
      const { data: existingParticipations } = await supabase
        .from("ops_conversation_participants")
        .select("conversation_id")
        .eq("admin_id", currentUserId)
        .is("left_at", null);

      if (existingParticipations) {
        for (const p of existingParticipations) {
          const { data: otherParticipant } = await supabase
            .from("ops_conversation_participants")
            .select("admin_id")
            .eq("conversation_id", p.conversation_id)
            .eq("admin_id", adminId)
            .is("left_at", null)
            .single();

          if (otherParticipant) {
            // Mevcut sohbeti aç
            const conv = conversations.find((c) => c.id === p.conversation_id);
            if (conv) {
              setActiveConversation(conv);
              setShowNewChatDialog(false);
              return;
            }
          }
        }
      }

      // Yeni sohbet oluştur
      const { data: newConv, error: convError } = await supabase
        .from("ops_conversations")
        .insert({
          type: "direct",
          created_by: currentUserId
        })
        .select()
        .single();

      if (convError) throw convError;

      // Katılımcıları ekle
      await supabase.from("ops_conversation_participants").insert([
        { conversation_id: newConv.id, admin_id: currentUserId, role: "admin" },
        { conversation_id: newConv.id, admin_id: adminId, role: "member" }
      ]);

      // Sohbeti yükle
      const admin = admins.find((a) => a.id === adminId);
      const newConversation: OpsConversation = {
        id: newConv.id,
        type: "direct",
        name: null,
        avatar_url: null,
        last_message_at: null,
        created_at: newConv.created_at,
        participants: [
          { admin_id: currentUserId, admin: admins.find((a) => a.id === currentUserId) || null },
          { admin_id: adminId, admin: admin || null }
        ],
        unread_count: 0
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setShowNewChatDialog(false);
      toast.success("Sohbet başlatıldı");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Sohbet başlatılamadı");
    }
  };

  // Grup oluştur
  const handleCreateGroup = async () => {
    if (!currentUserId || selectedAdmins.length < 1 || !groupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      // Grup sohbeti oluştur
      const { data: convData, error: convError } = await supabase
        .from("ops_conversations")
        .insert({
          type: "group",
          name: groupName.trim(),
          created_by: currentUserId
        })
        .select()
        .single();

      if (convError) throw convError;

      // Tüm katılımcıları ekle (kendisi + seçilenler)
      const allParticipants = [currentUserId, ...selectedAdmins];
      const participantInserts = allParticipants.map((adminId) => ({
        conversation_id: convData.id,
        admin_id: adminId,
        role: adminId === currentUserId ? "admin" : "member"
      }));

      const { error: partError } = await supabase
        .from("ops_conversation_participants")
        .insert(participantInserts);

      if (partError) throw partError;

      // Yeni conversation'ı listeye ekle
      const newConversation: OpsConversation = {
        id: convData.id,
        type: "group",
        name: groupName.trim(),
        avatar_url: null,
        last_message_at: null,
        created_at: convData.created_at,
        participants: allParticipants.map((adminId) => ({
          admin_id: adminId,
          admin: admins.find((a) => a.id === adminId) || null
        })),
        unread_count: 0
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setShowNewChatDialog(false);
      setIsGroupMode(false);
      setSelectedAdmins([]);
      setGroupName("");
      toast.success("Grup oluşturuldu");
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Grup oluşturulamadı");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Admin seçimi toggle
  const toggleAdminSelection = (adminId: string) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]
    );
  };

  // Sohbet adını al
  const getConversationName = (conv: OpsConversation) => {
    if (conv.name) return conv.name;
    if (conv.type === "direct") {
      const otherParticipant = conv.participants.find((p) => p.admin_id !== currentUserId);
      return otherParticipant?.admin?.full_name || otherParticipant?.admin?.email || "Anonim";
    }
    return "Grup Sohbeti";
  };

  // Filtrelenmiş adminler
  const filteredAdmins = admins.filter((admin) => {
    if (admin.id === currentUserId) return false;
    if (!searchAdmin) return true;
    const searchLower = searchAdmin.toLowerCase();
    return (
      admin.full_name?.toLowerCase().includes(searchLower) ||
      admin.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Chat</h1>
          <p className="text-muted-foreground">Diğer admin&apos;lerle mesajlaşın</p>
        </div>
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sohbet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isGroupMode ? "Grup Oluştur" : "Yeni Sohbet Başlat"}</DialogTitle>
              <DialogDescription>
                {isGroupMode
                  ? "Grup için üyeleri seçin ve isim verin"
                  : "Mesajlaşmak istediğiniz admin'i seçin veya grup oluşturun"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={isGroupMode ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setIsGroupMode(false);
                    setSelectedAdmins([]);
                    setGroupName("");
                  }}
                >
                  <User className="h-4 w-4 mr-1" />
                  Direkt Mesaj
                </Button>
                <Button
                  variant={isGroupMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsGroupMode(true)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Grup Oluştur
                </Button>
              </div>

              {/* Grup ismi (sadece grup modunda) */}
              {isGroupMode && (
                <Input
                  placeholder="Grup adı..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              )}

              {/* Seçilen adminler (grup modunda) */}
              {isGroupMode && selectedAdmins.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedAdmins.map((adminId) => {
                    const admin = admins.find((a) => a.id === adminId);
                    return (
                      <Badge key={adminId} variant="secondary" className="gap-1">
                        {admin?.full_name || "Admin"}
                        <button
                          onClick={() => toggleAdminSelection(adminId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Admin ara..."
                  value={searchAdmin}
                  onChange={(e) => setSearchAdmin(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Admin listesi */}
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredAdmins.map((admin) => {
                    const isSelected = selectedAdmins.includes(admin.id);
                    return (
                      <div
                        key={admin.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                        onClick={() => {
                          if (isGroupMode) {
                            toggleAdminSelection(admin.id);
                          } else {
                            handleStartChat(admin.id);
                          }
                        }}
                      >
                        <Avatar>
                          <AvatarImage src={admin.avatar_url || undefined} />
                          <AvatarFallback>{admin.full_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{admin.full_name || "İsimsiz"}</div>
                        </div>
                        {isGroupMode && isSelected && (
                          <CheckCheck className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    );
                  })}
                  {filteredAdmins.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">Admin bulunamadı</div>
                  )}
                </div>
              </ScrollArea>

              {/* Grup oluştur butonu */}
              {isGroupMode && (
                <Button
                  className="w-full"
                  onClick={handleCreateGroup}
                  disabled={selectedAdmins.length < 1 || !groupName.trim() || isCreatingGroup}
                >
                  {isCreatingGroup ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Grup Oluştur ({selectedAdmins.length} üye)
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sohbetler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz sohbet yok</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        activeConversation?.id === conv.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => setActiveConversation(conv)}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {conv.type === "group" ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{getConversationName(conv)}</span>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        {conv.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                              locale: tr
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2 flex flex-col">
          {activeConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {activeConversation.type === "group" ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {getConversationName(activeConversation)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {activeConversation.participants.length} katılımcı
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
                        >
                          <div
                            className={`flex gap-2 max-w-[70%] ${isMine ? "flex-row-reverse" : ""}`}
                          >
                            {!isMine && (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {msg.sender?.full_name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex flex-col">
                              {/* Sender adı ve badge */}
                              {!isMine && (
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {msg.sender?.full_name || "Anonim"}
                                  </span>
                                  {msg.sender?.role === "super_admin" && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] px-1 py-0 h-4"
                                    >
                                      <Shield className="h-2.5 w-2.5 mr-0.5" />
                                      Super
                                    </Badge>
                                  )}
                                  {msg.sender?.role === "admin" && (
                                    <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
                                      Admin
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Reply preview */}
                              {msg.reply_to && (
                                <div className="mb-1 px-2 py-1 rounded bg-muted/50 border-l-2 border-primary text-xs max-w-48">
                                  <span className="font-medium">{msg.reply_to.sender_name}</span>
                                  <p className="text-muted-foreground truncate">
                                    {msg.reply_to.content}
                                  </p>
                                </div>
                              )}

                              {/* Mesaj içeriği */}
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>

                              {/* Zaman ve okundu durumu */}
                              <div
                                className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}
                              >
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(msg.created_at), {
                                    addSuffix: true,
                                    locale: tr
                                  })}
                                </span>
                                {isMine && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
                              </div>
                            </div>

                            {/* Reply butonu - hover'da görünür */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                              onClick={() => setReplyTo(msg)}
                            >
                              <Reply className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <Separator />

                {/* Reply preview bar */}
                {replyTo && (
                  <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium">{replyTo.sender?.full_name || "Anonim"}</span>
                        <span className="text-muted-foreground ml-2 truncate max-w-48 inline-block align-bottom">
                          {replyTo.content}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setReplyTo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={replyTo ? "Yanıt yaz..." : "Mesaj yaz..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        if (e.key === "Escape" && replyTo) {
                          setReplyTo(null);
                        }
                      }}
                      className="min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sohbet seçin veya yeni bir sohbet başlatın</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
