"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Plus, Search, User, Users, X, Loader2, Check, MessageSquarePlus } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdminProfile, OpsConversation } from "../../types";

interface NewChatDialogProps {
  currentUserId: string;
  existingConversations: OpsConversation[];
  onConversationCreated: (conversation: OpsConversation) => void;
}

export function NewChatDialog({
  currentUserId,
  existingConversations,
  onConversationCreated
}: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createBrowserSupabaseClient();

  // Load admins
  useEffect(() => {
    if (!open) return;

    async function loadAdmins() {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, role")
          .eq("role", "admin")
          .eq("type", "real")
          .neq("user_id", currentUserId);

        const formatted: AdminProfile[] = (data || []).map((p) => ({
          id: p.user_id,
          full_name: p.display_name || p.username,
          email: null,
          is_active: true,
          avatar_url: p.avatar_url,
          role: p.role
        }));

        setAdmins(formatted);
      } catch (error) {
        console.error("[NewChatDialog] Error loading admins:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdmins();
  }, [open, currentUserId, supabase]);

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return admin.full_name?.toLowerCase().includes(query);
  });

  // Toggle admin selection (group mode)
  const toggleAdmin = useCallback((adminId: string) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]
    );
  }, []);

  // Start direct chat
  const handleStartDirectChat = useCallback(
    async (adminId: string) => {
      // Check if conversation already exists
      const existingConv = existingConversations.find(
        (c) => c.type === "direct" && c.participants.some((p) => p.admin_id === adminId)
      );

      if (existingConv) {
        onConversationCreated(existingConv);
        setOpen(false);
        return;
      }

      setIsCreating(true);
      try {
        // Create conversation
        const { data: convData, error: convError } = await supabase
          .from("ops_conversations")
          .insert({
            type: "direct",
            created_by: currentUserId
          })
          .select()
          .single();

        if (convError) throw convError;

        // Add participants
        const { error: partError } = await supabase.from("ops_conversation_participants").insert([
          { conversation_id: convData.id, admin_id: currentUserId, role: "admin" },
          { conversation_id: convData.id, admin_id: adminId, role: "member" }
        ]);

        if (partError) throw partError;

        const admin = admins.find((a) => a.id === adminId);
        const newConversation: OpsConversation = {
          id: convData.id,
          type: "direct",
          name: null,
          avatar_url: null,
          last_message_at: null,
          created_at: convData.created_at,
          created_by: currentUserId,
          participants: [
            { admin_id: currentUserId, admin: null, can_write: true },
            { admin_id: adminId, admin: admin || null, can_write: true }
          ],
          unread_count: 0
        };

        onConversationCreated(newConversation);
        setOpen(false);
        toast.success("Sohbet başlatıldı");
      } catch (error) {
        console.error("[NewChatDialog] Error creating chat:", error);
        toast.error("Sohbet başlatılamadı");
      } finally {
        setIsCreating(false);
      }
    },
    [currentUserId, existingConversations, admins, supabase, onConversationCreated]
  );

  // Create group
  const handleCreateGroup = useCallback(async () => {
    if (selectedAdmins.length < 1 || !groupName.trim()) return;

    setIsCreating(true);
    try {
      // Create conversation
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

      // Add participants
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

      const newConversation: OpsConversation = {
        id: convData.id,
        type: "group",
        name: groupName.trim(),
        avatar_url: null,
        last_message_at: null,
        created_at: convData.created_at,
        created_by: currentUserId,
        participants: allParticipants.map((adminId) => ({
          admin_id: adminId,
          admin: admins.find((a) => a.id === adminId) || null,
          can_write: true
        })),
        unread_count: 0
      };

      onConversationCreated(newConversation);
      setOpen(false);
      setActiveTab("direct");
      setSelectedAdmins([]);
      setGroupName("");
      toast.success("Grup oluşturuldu");
    } catch (error) {
      console.error("[NewChatDialog] Error creating group:", error);
      toast.error("Grup oluşturulamadı");
    } finally {
      setIsCreating(false);
    }
  }, [currentUserId, selectedAdmins, groupName, admins, supabase, onConversationCreated]);

  // Reset on close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setActiveTab("direct");
      setSelectedAdmins([]);
      setGroupName("");
      setSearchQuery("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Yeni Sohbet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Yeni Sohbet Başlat</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={(v) => {
            setActiveTab(v as "direct" | "group");
            if (v === "direct") {
              setSelectedAdmins([]);
              setGroupName("");
            }
          }}
        >
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="direct" className="gap-2">
                <User className="h-4 w-4" />
                Direkt Mesaj
              </TabsTrigger>
              <TabsTrigger value="group" className="gap-2">
                <Users className="h-4 w-4" />
                Grup Oluştur
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 pt-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Admin ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <TabsContent value="direct" className="mt-0">
              <ScrollArea className="h-[300px] -mx-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAdmins.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Admin bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-1 px-2">
                    {filteredAdmins.map((admin) => (
                      <button
                        key={admin.id}
                        onClick={() => handleStartDirectChat(admin.id)}
                        disabled={isCreating}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={admin.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {admin.full_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{admin.full_name}</p>
                          <p className="text-xs text-muted-foreground">{admin.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="group" className="mt-0 space-y-4">
              {/* Group name */}
              <div>
                <label className="text-sm font-medium mb-2 block">Grup Adı</label>
                <Input
                  placeholder="Örn: Moderatörler, Destek Ekibi..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              {/* Selected admins */}
              {selectedAdmins.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Seçilen Üyeler ({selectedAdmins.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAdmins.map((adminId) => {
                      const admin = admins.find((a) => a.id === adminId);
                      return (
                        <Badge key={adminId} variant="secondary" className="gap-1 pr-1 py-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={admin?.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {admin?.full_name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {admin?.full_name || "Admin"}
                          <button
                            onClick={() => toggleAdmin(adminId)}
                            className="ml-1 hover:text-destructive rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin list for selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Üye Ekle</label>
                <ScrollArea className="h-[200px] border rounded-lg">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredAdmins.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Admin bulunamadı</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredAdmins.map((admin) => {
                        const isSelected = selectedAdmins.includes(admin.id);
                        return (
                          <button
                            key={admin.id}
                            onClick={() => toggleAdmin(admin.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                              isSelected ? "bg-primary/10" : "hover:bg-muted"
                            )}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={admin.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-muted">
                                {admin.full_name?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{admin.full_name}</p>
                            </div>
                            {isSelected && (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Create button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleCreateGroup}
                disabled={selectedAdmins.length < 1 || !groupName.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Grup Oluştur ({selectedAdmins.length + 1} üye)
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
