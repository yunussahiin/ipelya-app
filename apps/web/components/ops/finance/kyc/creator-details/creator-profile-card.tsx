"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, Heart, Image as ImageIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isCreator: boolean;
  isVerified: boolean;
  email?: string;
  createdAt: string;
  lastActiveAt?: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
    subscribers: number;
  };
  kycStatus?: {
    level: "none" | "basic" | "full";
    status: "pending" | "approved" | "rejected";
    verifiedAt?: string;
  };
}

interface CreatorProfileCardProps {
  profile: CreatorProfile;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString("tr-TR");
}

function getKYCStatusBadge(status?: CreatorProfile["kycStatus"]) {
  if (!status) {
    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        KYC Yok
      </Badge>
    );
  }

  const levelLabels = {
    none: "Yok",
    basic: "Temel",
    full: "Tam"
  };

  const statusConfig = {
    pending: {
      variant: "secondary" as const,
      icon: Clock,
      label: "Beklemede"
    },
    approved: {
      variant: "default" as const,
      icon: CheckCircle2,
      label: "Onaylı"
    },
    rejected: {
      variant: "destructive" as const,
      icon: XCircle,
      label: "Reddedildi"
    }
  };

  const config = statusConfig[status.status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {levelLabels[status.level]} - {config.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function CreatorProfileCard({ profile }: CreatorProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Creator Profili
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
            <AvatarFallback className="text-lg">
              {profile.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">
                {profile.displayName || profile.username}
              </h3>
              {profile.isVerified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-blue-500" />
                  Doğrulanmış
                </Badge>
              )}
              {profile.isCreator && (
                <Badge
                  variant="outline"
                  className="gap-1 border-purple-500/50 text-purple-600 dark:text-purple-400"
                >
                  Creator
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2 line-clamp-2">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatItem icon={Users} label="Takipçi" value={formatNumber(profile.stats.followers)} />
          <StatItem icon={Users} label="Takip" value={formatNumber(profile.stats.following)} />
          <StatItem icon={ImageIcon} label="Gönderi" value={formatNumber(profile.stats.posts)} />
          <StatItem icon={Heart} label="Abone" value={formatNumber(profile.stats.subscribers)} />
        </div>

        {/* Info Grid */}
        <div className="space-y-3 pt-4 border-t">
          <InfoRow label="E-posta" value={profile.email || "-"} />
          <InfoRow
            label="Kayıt Tarihi"
            value={
              profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "-"
            }
          />
          <InfoRow
            label="Son Aktivite"
            value={
              profile.lastActiveAt
                ? formatDistanceToNow(new Date(profile.lastActiveAt), {
                    addSuffix: true,
                    locale: tr
                  })
                : "-"
            }
          />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">KYC Durumu</span>
            {getKYCStatusBadge(profile.kycStatus)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────

function StatItem({
  icon: Icon,
  label,
  value
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="font-semibold text-lg">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function CreatorProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Creator Profili
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header Skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-4 w-4 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
          ))}
        </div>

        {/* Info Grid Skeleton */}
        <div className="space-y-3 pt-4 border-t">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
