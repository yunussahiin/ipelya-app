"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { KYCStatusBadge, type KYCStatus } from "./status-badge";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface CreatorInfo {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
  kycStatus?: KYCStatus;
  kycLevel?: "basic" | "full";
  createdAt?: string;
}

interface CreatorCardProps {
  creator: CreatorInfo;
  showKYC?: boolean;
  showEmail?: boolean;
  showCreatedAt?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function CreatorCard({
  creator,
  showKYC = false,
  showEmail = true,
  showCreatedAt = false,
  size = "md",
  className,
  onClick
}: CreatorCardProps) {
  const avatarSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = creator.displayName || creator.username;

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      <Avatar className={avatarSizes[size]}>
        <AvatarImage src={creator.avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-medium truncate", textSizes[size])}>@{creator.username}</p>
          {showKYC && creator.kycStatus && (
            <KYCStatusBadge status={creator.kycStatus} level={creator.kycLevel} showIcon={false} />
          )}
        </div>

        {showEmail && creator.email && (
          <p className="text-sm text-muted-foreground truncate">{creator.email}</p>
        )}

        {showCreatedAt && creator.createdAt && (
          <p className="text-xs text-muted-foreground">
            Kayıt: {new Date(creator.createdAt).toLocaleDateString("tr-TR")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Creator Card with Card wrapper
// ─────────────────────────────────────────────────────────

interface CreatorInfoCardProps extends CreatorCardProps {
  title?: string;
}

export function CreatorInfoCard({
  creator,
  title = "Creator Bilgileri",
  ...props
}: CreatorInfoCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
        <CreatorCard creator={creator} {...props} />
      </CardContent>
    </Card>
  );
}
