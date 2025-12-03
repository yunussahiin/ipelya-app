"use client";

import type { TypingStatus } from "../../types";

interface TypingIndicatorProps {
  typingUsers: TypingStatus[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((t) => t.admin_name || "Birisi").slice(0, 3);
  let text: string;

  if (names.length === 1) {
    text = `${names[0]} yazıyor`;
  } else if (names.length === 2) {
    text = `${names[0]} ve ${names[1]} yazıyor`;
  } else {
    text = `${names[0]} ve ${names.length - 1} kişi daha yazıyor`;
  }

  return (
    <div className="px-4 py-2 border-t bg-muted/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span>{text}</span>
      </div>
    </div>
  );
}
