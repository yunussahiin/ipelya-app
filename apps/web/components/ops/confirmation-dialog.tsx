"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Onayla",
  cancelText = "İptal",
  onConfirm,
  isLoading = false,
  isDangerous = false
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isDangerous && <AlertTriangle className="h-5 w-5 text-red-500" />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={isDangerous ? "destructive" : "default"}
          >
            {isLoading ? "İşleniyor..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
