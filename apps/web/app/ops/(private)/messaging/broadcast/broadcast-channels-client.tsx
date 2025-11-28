"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Search, Radio, Users, MessageSquare, ChevronRight, Globe, Lock, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Creator {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface BroadcastChannel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  access_type: "public" | "subscribers_only" | "tier_specific";
  member_count: number;
  message_count: number;
  is_active: boolean;
  created_at: string;
  creator_id: string | null;
  creator: Creator | null;
}

interface BroadcastChannelsClientProps {
  channels: BroadcastChannel[];
}

export function BroadcastChannelsClient({ channels }: BroadcastChannelsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtreleme
  const filteredChannels = channels.filter((channel) => {
    // Arama filtresi
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = channel.name.toLowerCase().includes(searchLower);
      const matchesCreator =
        channel.creator?.display_name?.toLowerCase().includes(searchLower) ||
        channel.creator?.username?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesCreator) return false;
    }

    // Erişim tipi filtresi
    if (accessFilter !== "all" && channel.access_type !== accessFilter) return false;

    // Durum filtresi
    if (statusFilter === "active" && !channel.is_active) return false;
    if (statusFilter === "inactive" && channel.is_active) return false;

    return true;
  });

  const getAccessIcon = (type: string) => {
    switch (type) {
      case "public":
        return <Globe className="h-3 w-3" />;
      case "subscribers_only":
        return <Lock className="h-3 w-3" />;
      case "tier_specific":
        return <Star className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getAccessLabel = (type: string) => {
    switch (type) {
      case "public":
        return "Herkese Açık";
      case "subscribers_only":
        return "Abonelere Özel";
      case "tier_specific":
        return "Tier Özel";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Kanallar</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kanal veya creator ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full md:w-64"
              />
            </div>
            <Select value={accessFilter} onValueChange={setAccessFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Erişim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="public">Herkese Açık</SelectItem>
                <SelectItem value="subscribers_only">Abonelere Özel</SelectItem>
                <SelectItem value="tier_specific">Tier Özel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredChannels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Kanal bulunamadı</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kanal</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Erişim</TableHead>
                <TableHead>Üyeler</TableHead>
                <TableHead>Mesajlar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChannels.map((channel) => (
                <TableRow
                  key={channel.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/ops/messaging/broadcast/${channel.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={channel.avatar_url || undefined} />
                        <AvatarFallback>
                          <Radio className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        {channel.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-48">
                            {channel.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {channel.creator ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={channel.creator.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {channel.creator.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {channel.creator.display_name || channel.creator.username || "Anonim"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {getAccessIcon(channel.access_type)}
                      {getAccessLabel(channel.access_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {channel.member_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      {channel.message_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={channel.is_active ? "default" : "secondary"}>
                      {channel.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(channel.created_at), {
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
