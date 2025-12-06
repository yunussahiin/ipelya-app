"use client";

/**
 * ModerationActions Component
 * Toplu moderasyon işlemleri (Kick All, Terminate vb.)
 */

import { useState } from "react";
import { XCircle, UserX, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { TerminateDialog } from "./terminate-dialog";

interface ModerationActionsProps {
  sessionId: string;
  sessionTitle: string;
  onRefresh?: () => void;
}

export function ModerationActions({ sessionId, sessionTitle, onRefresh }: ModerationActionsProps) {
  const [showTerminate, setShowTerminate] = useState(false);

  const handleTerminate = async (reason: string, adminNote?: string) => {
    try {
      const response = await fetch(`/api/ops/live/sessions/${sessionId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, adminNote })
      });

      if (!response.ok) {
        throw new Error("Oturum sonlandırılamadı");
      }

      toast.success("Oturum başarıyla sonlandırıldı");
      onRefresh?.();
    } catch (error) {
      toast.error("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setShowTerminate(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="destructive" size="sm">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Moderasyon
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => toast.info("Bu özellik geliştiriliyor")}>
            <UserX className="mr-2 h-4 w-4" />
            Tüm İzleyicileri Çıkar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setShowTerminate(true)}>
            <XCircle className="mr-2 h-4 w-4" />
            Yayını Sonlandır
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TerminateDialog
        open={showTerminate}
        onOpenChange={setShowTerminate}
        sessionTitle={sessionTitle}
        onConfirm={handleTerminate}
      />
    </>
  );
}
