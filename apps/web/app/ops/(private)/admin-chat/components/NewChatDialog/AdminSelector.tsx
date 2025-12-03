"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminProfile } from "../../types";

interface AdminSelectorProps {
  admins: AdminProfile[];
  selectedIds: string[];
  isGroupMode: boolean;
  onSelect: (adminId: string) => void;
  onToggle: (adminId: string) => void;
}

export function AdminSelector({
  admins,
  selectedIds,
  isGroupMode,
  onSelect,
  onToggle
}: AdminSelectorProps) {
  if (admins.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Admin bulunamadı</div>;
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-1">
        {admins.map((admin) => {
          const isSelected = selectedIds.includes(admin.id);
          return (
            <div
              key={admin.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted border border-transparent"
              )}
              onClick={() => {
                if (isGroupMode) {
                  onToggle(admin.id);
                } else {
                  onSelect(admin.id);
                }
              }}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={admin.avatar_url || undefined} />
                <AvatarFallback className="bg-muted">
                  {admin.full_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{admin.full_name || "İsimsiz"}</p>
                {admin.email && (
                  <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                )}
              </div>
              {isGroupMode && isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
