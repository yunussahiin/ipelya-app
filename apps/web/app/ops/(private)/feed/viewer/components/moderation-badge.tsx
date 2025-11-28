/**
 * ModerationBadge Component
 * İçeriğin moderasyon durumunu gösteren badge
 * Tıklanınca detay ve işlem değiştirme seçenekleri
 */

"use client";

import { useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconTrash,
  IconUser
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import type { FeedItem } from "../types";

interface ModerationBadgeProps {
  item: FeedItem;
  onChangeAction?: () => void;
}

export function ModerationBadge({ item, onChangeAction }: ModerationBadgeProps) {
  const [open, setOpen] = useState(false);

  const { is_hidden, moderation_status, last_moderation, moderated_at } = item;

  // Moderasyon durumu yoksa gösterme
  if (
    !is_hidden &&
    moderation_status !== "hidden" &&
    moderation_status !== "deleted" &&
    !last_moderation
  ) {
    return null;
  }

  // Durum bilgisi
  const getStatusInfo = () => {
    if (moderation_status === "deleted") {
      return {
        label: "Silindi",
        icon: IconTrash,
        color: "bg-red-500/10 text-red-600 border-red-500/30",
        description: "Bu içerik kalıcı olarak silindi"
      };
    }
    if (is_hidden || moderation_status === "hidden") {
      return {
        label: "Gizli",
        icon: IconEyeOff,
        color: "bg-orange-500/10 text-orange-600 border-orange-500/30",
        description: "Bu içerik kullanıcıdan gizlendi"
      };
    }
    if (last_moderation?.action_type === "warn") {
      return {
        label: "Uyarıldı",
        icon: IconAlertTriangle,
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
        description: "Bu içerik için uyarı gönderildi"
      };
    }
    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const StatusIcon = statusInfo.icon;

  // Zaman formatla
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge variant="outline" className={`cursor-pointer gap-1 ${statusInfo.color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusInfo.label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Başlık */}
          <div className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            <div>
              <p className="font-medium">{statusInfo.label}</p>
              <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>

          <Separator />

          {/* Detaylar */}
          <div className="space-y-2 text-sm">
            {last_moderation && (
              <>
                {/* Neden */}
                {last_moderation.reason_title && (
                  <div className="flex items-start gap-2">
                    <IconAlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Neden</p>
                      <p className="font-medium">{last_moderation.reason_title}</p>
                    </div>
                  </div>
                )}

                {/* Admin */}
                {last_moderation.admin_name && (
                  <div className="flex items-start gap-2">
                    <IconUser className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">İşlemi Yapan</p>
                      <p className="font-medium">{last_moderation.admin_name}</p>
                    </div>
                  </div>
                )}

                {/* Tarih */}
                <div className="flex items-start gap-2">
                  <IconClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Tarih</p>
                    <p className="font-medium">{formatDate(last_moderation.created_at)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Fallback: sadece moderated_at varsa */}
            {!last_moderation && moderated_at && (
              <div className="flex items-start gap-2">
                <IconClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Tarih</p>
                  <p className="font-medium">{formatDate(moderated_at)}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Aksiyonlar */}
          <div className="flex gap-2">
            {(is_hidden || moderation_status === "hidden") && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => {
                  setOpen(false);
                  onChangeAction?.();
                }}
              >
                <IconEye className="h-4 w-4" />
                Göster
              </Button>
            )}
            {moderation_status === "deleted" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => {
                  setOpen(false);
                  onChangeAction?.();
                }}
              >
                <IconCheck className="h-4 w-4" />
                Geri Yükle
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                onChangeAction?.();
              }}
            >
              İşlemi Değiştir
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
