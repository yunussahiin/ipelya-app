"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, Users, PanelLeft, PanelLeftClose, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationItem } from "./ConversationItem";
import { ConversationSkeleton } from "./ConversationSkeleton";
import type { OpsConversation } from "../../types";

type FilterType = "all" | "direct" | "group";

interface ConversationListProps {
  conversations: OpsConversation[];
  activeConversationId: string | null;
  currentUserId: string;
  isLoading: boolean;
  onSelect: (conversation: OpsConversation) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  isLoading,
  onSelect,
  isCollapsed = false,
  onToggleCollapse
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Count by type
  const directCount = conversations.filter((c) => c.type === "direct").length;
  const groupCount = conversations.filter((c) => c.type === "group").length;

  const filteredConversations = conversations.filter((conv) => {
    // Filter by type
    if (filter === "direct" && conv.type !== "direct") return false;
    if (filter === "group" && conv.type !== "group") return false;

    // Filter by search
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    // Search by name
    if (conv.name?.toLowerCase().includes(query)) return true;

    // Search by participant names
    const participantMatch = conv.participants.some((p) =>
      p.admin?.full_name?.toLowerCase().includes(query)
    );
    if (participantMatch) return true;

    // Search by last message
    if (conv.last_message?.toLowerCase().includes(query)) return true;

    return false;
  });

  // Collapsed view - only show avatars
  if (isCollapsed) {
    return (
      <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
        <CardHeader className="py-3 px-2 border-b shrink-0">
          <Button variant="ghost" size="icon" className="w-full h-8" onClick={onToggleCollapse}>
            <PanelLeft className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-2 flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {filteredConversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const other = conv.participants.find((p) => p.admin_id !== currentUserId);
                const hasUnread = conv.unread_count > 0;

                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "relative flex items-center justify-center p-1 rounded-lg cursor-pointer transition-all",
                      isActive ? "bg-primary/10 ring-2 ring-primary/20" : "hover:bg-muted/50"
                    )}
                    onClick={() => onSelect(conv)}
                  >
                    {conv.type === "group" ? (
                      <div className="relative">
                        {conv.avatar_url ? (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatar_url} />
                            <AvatarFallback className="bg-primary/10">
                              <Users className="h-4 w-4 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={other?.admin?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-xs">
                          {other?.admin?.full_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                        <span className="text-[9px] text-destructive-foreground font-medium">
                          {conv.unread_count > 9 ? "9+" : conv.unread_count}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
      <CardHeader className="py-3 px-4 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Sohbetler
            <Badge variant="secondary" className="text-xs">
              {conversations.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleCollapse}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="all" className="text-xs h-7">
              Tümü
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-xs h-7 gap-1">
              <User className="h-3 w-3" />
              Sohbet
              {directCount > 0 && (
                <span className="text-[10px] text-muted-foreground">({directCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="group" className="text-xs h-7 gap-1">
              <Users className="h-3 w-3" />
              Grup
              {groupCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {groupCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sohbet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-2 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <ConversationSkeleton />
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {searchQuery
                  ? "Sonuç bulunamadı"
                  : filter === "group"
                    ? "Henüz grup yok"
                    : filter === "direct"
                      ? "Henüz sohbet yok"
                      : "Henüz sohbet yok"}
              </p>
              {!searchQuery && <p className="text-xs mt-1">Yeni sohbet başlatın</p>}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeConversationId === conv.id}
                  currentUserId={currentUserId}
                  onClick={() => onSelect(conv)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
