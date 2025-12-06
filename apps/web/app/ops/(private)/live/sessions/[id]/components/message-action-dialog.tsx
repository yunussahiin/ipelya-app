"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

import type { LiveMessage, MessageActionType } from "./types";

interface MessageActionDialogProps {
  selectedMessage: LiveMessage | null;
  messageAction: MessageActionType;
  actionLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MessageActionDialog({
  selectedMessage,
  messageAction,
  actionLoading,
  onClose,
  onConfirm
}: MessageActionDialogProps) {
  return (
    <AlertDialog
      open={!!selectedMessage && !!messageAction}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {messageAction === "delete" && "Mesajı Sil"}
            {messageAction === "kick" && "Kullanıcıyı Çıkar"}
            {messageAction === "ban" && "Kullanıcıyı Yasakla"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {messageAction === "delete" && "Bu mesajı silmek istediğinize emin misiniz?"}
            {messageAction === "kick" &&
              `@${selectedMessage?.sender?.username} kullanıcısını bu oturumdan çıkarmak istediğinize emin misiniz?`}
            {messageAction === "ban" &&
              `@${selectedMessage?.sender?.username} kullanıcısını yasaklamak istediğinize emin misiniz? Kullanıcı bu oturuma bir daha katılamaz.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={actionLoading}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={actionLoading}
            className={
              messageAction === "ban"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {actionLoading
              ? "İşleniyor..."
              : messageAction === "delete"
                ? "Sil"
                : messageAction === "kick"
                  ? "Çıkar"
                  : "Yasakla"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
