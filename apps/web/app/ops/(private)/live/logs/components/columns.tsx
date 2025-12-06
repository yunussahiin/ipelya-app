"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Video,
  Users,
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Unplug,
  Radio,
  MonitorPlay,
  Upload,
  Download,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  RefreshCw
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { DataTableColumnHeader } from "./data-table-column-header";

// WebhookLog interface
export interface WebhookLog {
  id: string;
  event_type: string;
  room_name: string | null;
  room_sid: string | null;
  participant_identity: string | null;
  participant_sid: string | null;
  participant_profile: {
    username: string;
    avatar_url: string | null;
  } | null;
  session_id: string | null;
  call_id: string | null;
  raw_payload: Record<string, unknown>;
  processing_status: string;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

// Event konfigürasyonu
const EVENT_CONFIG: Record<string, { icon: React.ReactNode; name: string; color: string }> = {
  room_started: {
    icon: <Video className="h-4 w-4" />,
    name: "Oda Başlatıldı",
    color: "text-green-500"
  },
  room_finished: {
    icon: <Video className="h-4 w-4" />,
    name: "Oda Sonlandırıldı",
    color: "text-red-500"
  },
  participant_joined: {
    icon: <Users className="h-4 w-4" />,
    name: "Katılımcı Katıldı",
    color: "text-blue-500"
  },
  participant_left: {
    icon: <Users className="h-4 w-4" />,
    name: "Katılımcı Ayrıldı",
    color: "text-orange-500"
  },
  participant_active: {
    icon: <Radio className="h-4 w-4" />,
    name: "Katılımcı Aktif",
    color: "text-green-500"
  },
  participant_connection_aborted: {
    icon: <Unplug className="h-4 w-4" />,
    name: "Bağlantı Kesildi",
    color: "text-red-500"
  },
  track_published: {
    icon: <Upload className="h-4 w-4" />,
    name: "Track Yayınlandı",
    color: "text-purple-500"
  },
  track_unpublished: {
    icon: <Download className="h-4 w-4" />,
    name: "Track Kaldırıldı",
    color: "text-gray-500"
  },
  track_subscribed: {
    icon: <Radio className="h-4 w-4" />,
    name: "Track Abone Olundu",
    color: "text-blue-500"
  },
  track_unsubscribed: {
    icon: <Radio className="h-4 w-4" />,
    name: "Track Abonelik İptal",
    color: "text-gray-500"
  },
  track_muted: {
    icon: <MicOff className="h-4 w-4" />,
    name: "Track Susturuldu",
    color: "text-yellow-500"
  },
  track_unmuted: {
    icon: <Mic className="h-4 w-4" />,
    name: "Track Açıldı",
    color: "text-green-500"
  },
  egress_started: {
    icon: <MonitorPlay className="h-4 w-4" />,
    name: "Kayıt Başladı",
    color: "text-red-500"
  },
  egress_updated: {
    icon: <RefreshCw className="h-4 w-4" />,
    name: "Kayıt Güncellendi",
    color: "text-blue-500"
  },
  egress_ended: {
    icon: <MonitorPlay className="h-4 w-4" />,
    name: "Kayıt Bitti",
    color: "text-green-500"
  },
  ingress_started: {
    icon: <Camera className="h-4 w-4" />,
    name: "Giriş Başladı",
    color: "text-purple-500"
  },
  ingress_ended: {
    icon: <CameraOff className="h-4 w-4" />,
    name: "Giriş Bitti",
    color: "text-gray-500"
  }
};

// Bilinmeyen eventler için varsayılan
const getEventConfig = (eventType: string) => {
  return (
    EVENT_CONFIG[eventType] || {
      icon: <Webhook className="h-4 w-4" />,
      name: eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "text-muted-foreground"
    }
  );
};

// Status config
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  success: {
    icon: <CheckCircle className="h-3 w-3" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "Başarılı"
  },
  error: {
    icon: <XCircle className="h-3 w-3" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    label: "Hatalı"
  },
  skipped: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    label: "Atlandı"
  }
};

export const columns: ColumnDef<WebhookLog>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Zaman" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{format(date, "HH:mm:ss")}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true, locale: tr })}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: "event_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />,
    cell: ({ row }) => {
      const eventType = row.getValue("event_type") as string;
      const config = getEventConfig(eventType);
      return (
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{config.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{eventType}</span>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "room_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Oda" />,
    cell: ({ row }) => {
      const roomName = row.getValue("room_name") as string | null;
      return roomName ? (
        <span className="font-mono text-xs max-w-[200px] truncate block" title={roomName}>
          {roomName}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    }
  },
  {
    accessorKey: "participant_profile",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Katılımcı" />,
    cell: ({ row }) => {
      const profile = row.original.participant_profile;
      const identity = row.original.participant_identity;

      if (profile) {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">@{profile.username}</span>
          </div>
        );
      }

      if (identity) {
        return (
          <span
            className="text-xs text-muted-foreground font-mono truncate max-w-[120px] block"
            title={identity}
          >
            {identity}
          </span>
        );
      }

      return <span className="text-muted-foreground">-</span>;
    },
    filterFn: (row, id, value) => {
      const profile = row.original.participant_profile;
      if (!profile) return false;
      return profile.username?.toLowerCase().includes(value.toLowerCase());
    }
  },
  {
    accessorKey: "processing_status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Durum" />,
    cell: ({ row }) => {
      const status = row.getValue("processing_status") as string;
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.success;
      return (
        <Badge className={`${config.color} gap-1`}>
          {config.icon}
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "processing_time_ms",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Süre" />,
    cell: ({ row }) => {
      const time = row.getValue("processing_time_ms") as number | null;
      return time ? (
        <span className="text-sm font-mono">{time}ms</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const log = row.original;
      // @ts-expect-error - meta is custom
      const onViewDetail = table.options.meta?.onViewDetail;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail?.(log);
          }}
        >
          <Eye className="h-4 w-4" />
          Detay
        </Button>
      );
    }
  }
];
