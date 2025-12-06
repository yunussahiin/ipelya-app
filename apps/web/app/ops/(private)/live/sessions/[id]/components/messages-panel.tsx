"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageCircle, Trash2, UserX, Ban } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { LiveMessage, MessageActionType } from "./types";

interface MessagesPanelProps {
  messages: LiveMessage[];
  onMessageAction: (message: LiveMessage, action: MessageActionType) => void;
}

export const MessagesPanel = forwardRef<HTMLDivElement, MessagesPanelProps>(
  ({ messages, onMessageAction }, ref) => {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              Mesajlar
            </CardTitle>
            <Badge variant="secondary" className="font-mono">
              {messages.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Henüz mesaj yok</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex gap-3 group hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-linear-to-br from-blue-500 to-purple-600 text-white">
                        {msg.sender?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">@{msg.sender?.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "HH:mm", { locale: tr })}
                        </span>
                      </div>
                      <p className="text-sm wrap-break-word mt-0.5">{msg.content}</p>
                    </div>
                    {/* Mesaj Aksiyonları */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => onMessageAction(msg, "delete")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Mesajı Sil
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-orange-500"
                              onClick={() => onMessageAction(msg, "kick")}
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Kullanıcıyı Çıkar
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => onMessageAction(msg, "ban")}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Kullanıcıyı Yasakla
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))
              )}
              {/* Scroll anchor */}
              <div ref={ref} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
);

MessagesPanel.displayName = "MessagesPanel";
