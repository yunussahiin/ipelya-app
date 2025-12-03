"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Users,
  Settings,
  Crown,
  MessageSquareOff,
  MessageSquare,
  UserMinus,
  Shield,
  Camera,
  Pencil,
  PanelLeft
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { toast } from "sonner";
import type { OpsConversation, ConversationParticipant } from "../../types";

interface ChatHeaderProps {
  conversation: OpsConversation;
  currentUserId: string;
  onConversationUpdate?: (conversation: OpsConversation) => void;
  onOpenMobileDrawer?: () => void;
}

export function ChatHeader({
  conversation,
  currentUserId,
  onConversationUpdate,
  onOpenMobileDrawer
}: ChatHeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(conversation.name || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const supabase = createBrowserSupabaseClient();

  const isOwner = conversation.created_by === currentUserId;
  const currentParticipant = conversation.participants.find((p) => p.admin_id === currentUserId);
  const canWrite = currentParticipant?.can_write !== false;

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct") {
      const other = conversation.participants.find((p) => p.admin_id !== currentUserId);
      return other?.admin?.full_name || "Anonim";
    }
    return "Grup Sohbeti";
  };

  const getAvatar = () => {
    if (conversation.type === "group") {
      return conversation.avatar_url ? (
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.avatar_url} />
          <AvatarFallback className="bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
      );
    }
    const other = conversation.participants.find((p) => p.admin_id !== currentUserId);
    return (
      <Avatar className="h-10 w-10">
        <AvatarImage src={other?.admin?.avatar_url || undefined} />
        <AvatarFallback className="bg-muted">
          {other?.admin?.full_name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
    );
  };

  const toggleWritePermission = async (participantId: string, canWrite: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("ops_conversation_participants")
        .update({ can_write: canWrite })
        .eq("conversation_id", conversation.id)
        .eq("admin_id", participantId);

      if (error) throw error;

      // Update local state
      const updatedParticipants = conversation.participants.map((p) =>
        p.admin_id === participantId ? { ...p, can_write: canWrite } : p
      );

      onConversationUpdate?.({
        ...conversation,
        participants: updatedParticipants
      });

      toast.success(canWrite ? "Yazma yetkisi verildi" : "Yazma yetkisi kaldırıldı");
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Yetki güncellenemedi");
    } finally {
      setIsUpdating(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("ops_conversation_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("conversation_id", conversation.id)
        .eq("admin_id", participantId);

      if (error) throw error;

      const updatedParticipants = conversation.participants.filter(
        (p) => p.admin_id !== participantId
      );

      onConversationUpdate?.({
        ...conversation,
        participants: updatedParticipants
      });

      toast.success("Katılımcı gruptan çıkarıldı");
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Katılımcı çıkarılamadı");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateGroupName = async () => {
    if (!editedName.trim() || editedName === conversation.name) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("ops_conversations")
        .update({ name: editedName.trim() })
        .eq("id", conversation.id);

      if (error) throw error;

      onConversationUpdate?.({
        ...conversation,
        name: editedName.trim()
      });

      setIsEditingName(false);
      toast.success("Grup adı güncellendi");
    } catch (error) {
      console.error("Error updating group name:", error);
      toast.error("Grup adı güncellenemedi");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Sadece resim dosyaları yüklenebilir");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalı");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${conversation.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("ops-group-avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("ops-group-avatars").getPublicUrl(filePath);

      // Update conversation
      const { error: updateError } = await supabase
        .from("ops_conversations")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", conversation.id);

      if (updateError) throw updateError;

      onConversationUpdate?.({
        ...conversation,
        avatar_url: urlData.publicUrl
      });

      toast.success("Grup avatarı güncellendi");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Avatar yüklenemedi");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const ParticipantCard = ({ participant }: { participant: ConversationParticipant }) => {
    const isParticipantOwner = conversation.created_by === participant.admin_id;
    const isMe = participant.admin_id === currentUserId;

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={participant.admin?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {participant.admin?.full_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {participant.admin?.full_name || "Anonim"}
                {isMe && <span className="text-muted-foreground ml-1">(sen)</span>}
              </p>
            </div>
            {isParticipantOwner && <Crown className="h-4 w-4 text-yellow-500" />}
            {!participant.can_write && (
              <MessageSquareOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-72" side="left">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={participant.admin?.avatar_url || undefined} />
              <AvatarFallback className="bg-muted">
                {participant.admin?.full_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{participant.admin?.full_name || "Anonim"}</h4>
              {participant.admin?.email && (
                <p className="text-xs text-muted-foreground">{participant.admin.email}</p>
              )}
              <div className="flex gap-1 mt-2">
                {isParticipantOwner && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Grup Sahibi
                  </Badge>
                )}
                {participant.admin?.role === "super_admin" && (
                  <Badge variant="destructive" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
                {participant.can_write === false && (
                  <Badge variant="outline" className="text-xs">
                    <MessageSquareOff className="h-3 w-3 mr-1" />
                    Salt Okunur
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <CardHeader className="flex! flex-row! items-center! justify-between! py-3 px-4 border-b shrink-0">
      <div className="flex items-center gap-3">
        {getAvatar()}
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{getConversationName()}</CardTitle>
            {/* Badges - hidden on mobile */}
            {isOwner && (
              <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                <Crown className="h-3 w-3 mr-1" />
                Sahip
              </Badge>
            )}
            {!canWrite && (
              <Badge variant="outline" className="text-xs hidden md:inline-flex">
                <MessageSquareOff className="h-3 w-3 mr-1" />
                Salt Okunur
              </Badge>
            )}
          </div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <p className="text-xs text-muted-foreground cursor-pointer hover:underline">
                {conversation.participants.length} katılımcı
              </p>
            </HoverCardTrigger>
            <HoverCardContent className="w-64" align="start">
              <div className="space-y-1">
                <p className="text-sm font-medium mb-2">Katılımcılar</p>
                {conversation.participants.slice(0, 5).map((p) => (
                  <div key={p.admin_id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={p.admin?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {p.admin?.full_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{p.admin?.full_name || "Anonim"}</span>
                    {conversation.created_by === p.admin_id && (
                      <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                    )}
                  </div>
                ))}
                {conversation.participants.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{conversation.participants.length - 5} daha...
                  </p>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Mobile: Sohbetler button */}
        {onOpenMobileDrawer && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={onOpenMobileDrawer}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Settings button - only for group conversations */}
        {conversation.type === "group" && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Grup Ayarları</SheetTitle>
                <SheetDescription>Grup katılımcılarını ve yetkilerini yönetin</SheetDescription>
              </SheetHeader>

              <div className="px-6 mt-6 space-y-6">
                {/* Group Info with Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {conversation.avatar_url ? (
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={conversation.avatar_url} />
                        <AvatarFallback className="bg-primary/10">
                          <Users className="h-8 w-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    {isOwner && (
                      <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="h-5 w-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={isUploadingAvatar}
                        />
                      </label>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border rounded-md bg-background"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updateGroupName();
                            if (e.key === "Escape") {
                              setIsEditingName(false);
                              setEditedName(conversation.name || "");
                            }
                          }}
                        />
                        <Button size="sm" onClick={updateGroupName} disabled={isUpdating}>
                          Kaydet
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{conversation.name || "Grup Sohbeti"}</h3>
                        {isOwner && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setEditedName(conversation.name || "");
                                    setIsEditingName(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Grup adını düzenle</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {conversation.participants.length} katılımcı
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Participants List */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Katılımcılar</h4>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2 pr-4">
                      {conversation.participants.map((participant) => {
                        const isParticipantOwner = conversation.created_by === participant.admin_id;
                        const isMe = participant.admin_id === currentUserId;

                        return (
                          <div
                            key={participant.admin_id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <ParticipantCard participant={participant} />

                            {/* Actions - only for owner and not self */}
                            {isOwner && !isMe && !isParticipantOwner && (
                              <TooltipProvider>
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          id={`write-${participant.admin_id}`}
                                          checked={participant.can_write !== false}
                                          onCheckedChange={(checked) =>
                                            toggleWritePermission(participant.admin_id, checked)
                                          }
                                          disabled={isUpdating}
                                        />
                                        <Label
                                          htmlFor={`write-${participant.admin_id}`}
                                          className="text-xs cursor-pointer"
                                        >
                                          {participant.can_write !== false ? (
                                            <MessageSquare className="h-4 w-4" />
                                          ) : (
                                            <MessageSquareOff className="h-4 w-4" />
                                          )}
                                        </Label>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {participant.can_write !== false
                                        ? "Yazma yetkisini kaldır"
                                        : "Yazma yetkisi ver"}
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => removeParticipant(participant.admin_id)}
                                        disabled={isUpdating}
                                      >
                                        <UserMinus className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Gruptan çıkar</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Legend */}
                <div className="text-xs text-muted-foreground space-y-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span>Grup Sahibi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    <span>Yazma yetkisi var</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquareOff className="h-3 w-3" />
                    <span>Salt okunur (yazamaz)</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </CardHeader>
  );
}
