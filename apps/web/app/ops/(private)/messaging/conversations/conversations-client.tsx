"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Search, Users, User, ChevronRight, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
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

interface ConversationsClientProps {
  conversations: Conversation[];
}

export function ConversationsClient({ conversations }: ConversationsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Filtreleme
  const filteredConversations = conversations.filter((conv) => {
    // Arama filtresi
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

    // Tip filtresi
    if (typeFilter !== "all" && conv.type !== typeFilter) return false;

    // Arşiv filtresi
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

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.avatar_url) return conv.avatar_url;
    if (conv.participants.length > 0) {
      return conv.participants[0]?.avatar_url || null;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Sohbetler</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full md:w-64"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
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
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Arşiv
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Sohbet bulunamadı</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sohbet</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Katılımcılar</TableHead>
                <TableHead>Son Mesaj</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conv) => (
                <TableRow
                  key={conv.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/ops/messaging/conversations/${conv.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getConversationAvatar(conv) || undefined} />
                        <AvatarFallback>
                          {conv.type === "group" ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getConversationName(conv)}</div>
                        {conv.is_archived && (
                          <Badge variant="secondary" className="text-xs">
                            Arşivlenmiş
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={conv.type === "group" ? "default" : "outline"}>
                      {conv.type === "group" ? "Grup" : "Birebir"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {conv.participants.slice(0, 3).map((p) => (
                        <Avatar key={p.user_id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {p.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {conv.participants.length > 3 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                          +{conv.participants.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {conv.last_message_at
                      ? formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: true,
                          locale: tr
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.created_at), {
                      addSuffix: true,
                      locale: tr
                    })}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
