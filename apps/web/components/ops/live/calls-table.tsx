"use client";

/**
 * CallsTable Component
 * Aktif 1-1 çağrıları tablo olarak gösterir
 */

import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Phone, Video, PhoneCall } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Call } from "@/lib/types/live";

interface CallsTableProps {
  calls: Call[];
}

export function CallsTable({ calls }: CallsTableProps) {
  const getStatusBadge = (status: Call["status"]) => {
    switch (status) {
      case "ringing":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Çalıyor
          </Badge>
        );
      case "accepted":
      case "in_call":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            Görüşmede
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (calls.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <PhoneCall className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Aktif çağrı bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Phone className="h-5 w-5 text-green-500" />
        <h3 className="font-semibold">Aktif Çağrılar</h3>
        <Badge variant="secondary" className="ml-auto">
          {calls.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arayan</TableHead>
            <TableHead>Aranan</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Süre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={call.caller?.avatar_url || undefined} />
                    <AvatarFallback>
                      {call.caller?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">@{call.caller?.username || "unknown"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={call.callee?.avatar_url || undefined} />
                    <AvatarFallback>
                      {call.callee?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">@{call.callee?.username || "unknown"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {call.call_type === "video" ? (
                    <Video className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Phone className="h-4 w-4 text-green-500" />
                  )}
                  <span>{call.call_type === "video" ? "Görüntülü" : "Sesli"}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(call.status)}</TableCell>
              <TableCell>
                {call.accepted_at || call.initiated_at
                  ? formatDistanceToNow(new Date(call.accepted_at || call.initiated_at || ""), {
                      locale: tr
                    })
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
