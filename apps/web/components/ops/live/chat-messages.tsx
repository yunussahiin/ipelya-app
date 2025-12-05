"use client";

/**
 * Chat Mesajları Bileşeni
 * Oturumdaki son chat mesajlarını gösterir
 */

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageSquare, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  message_type: string;
  is_deleted: boolean;
  deleted_by: string | null;
  created_at: string;
  user: User | null;
}

interface ChatMessagesProps {
  sessionId: string;
  messages: Message[];
  onRefresh: () => void;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  loading?: boolean;
  maxHeight?: string;
}

export function ChatMessages({
  // sessionId - ileride realtime subscription için kullanılacak
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionId,
  messages,
  onRefresh,
  onDeleteMessage,
  loading = false,
  maxHeight = "400px"
}: ChatMessagesProps) {
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDelete = async () => {
    if (!deleteTarget || !onDeleteMessage) return;

    setDeleting(true);
    try {
      await onDeleteMessage(deleteTarget.id);
      toast.success("Mesaj silindi");
      setDeleteTarget(null);
    } catch {
      toast.error("Mesaj silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "system":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "gift":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "announcement":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "";
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Chat Mesajları
            </CardTitle>
            <CardDescription>{messages.length} mesaj</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="pr-4" style={{ height: maxHeight }} ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Henüz mesaj yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group flex gap-3 p-2 rounded-lg hover:bg-muted/50 ${
                      message.is_deleted ? "opacity-50" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={message.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {message.user?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">
                          {message.user?.display_name || "Bilinmiyor"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{message.user?.username || "?"}
                        </span>
                        {message.message_type !== "text" && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getMessageTypeColor(message.message_type)}`}
                          >
                            {message.message_type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </span>
                      </div>

                      {message.is_deleted ? (
                        <p className="text-sm text-muted-foreground italic">[Bu mesaj silindi]</p>
                      ) : (
                        <p className="text-sm break-all">{message.content}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {!message.is_deleted && onDeleteMessage && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(message)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Mesajı Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu mesajı silmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">@{deleteTarget.user?.username || "?"}</p>
              <p className="text-muted-foreground">{deleteTarget.content}</p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
