"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Status Types
// ─────────────────────────────────────────────────────────

export type PaymentMethodStatus = "pending" | "approved" | "rejected";
export type PayoutStatus = "pending" | "in_review" | "approved" | "paid" | "rejected" | "cancelled";
export type KYCStatus = "pending" | "approved" | "rejected" | "not_started";

// ─────────────────────────────────────────────────────────
// Status Configs
// ─────────────────────────────────────────────────────────

const paymentMethodStatusConfig: Record<
  PaymentMethodStatus,
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: "Beklemede",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: "⏳"
  },
  approved: {
    label: "Onaylı",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: "✅"
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: "❌"
  }
};

const payoutStatusConfig: Record<PayoutStatus, { label: string; className: string; icon: string }> =
  {
    pending: {
      label: "Beklemede",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: "⏳"
    },
    in_review: {
      label: "İnceleniyor",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      icon: "🔍"
    },
    approved: {
      label: "Onaylandı",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: "✅"
    },
    paid: {
      label: "Ödendi",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      icon: "💸"
    },
    rejected: {
      label: "Reddedildi",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: "❌"
    },
    cancelled: {
      label: "İptal Edildi",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      icon: "🚫"
    }
  };

const kycStatusConfig: Record<KYCStatus, { label: string; className: string; icon: string }> = {
  not_started: {
    label: "Başlanmadı",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    icon: "○"
  },
  pending: {
    label: "İnceleniyor",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: "⏳"
  },
  approved: {
    label: "Onaylı",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: "✅"
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: "❌"
  }
};

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

interface StatusBadgeProps {
  showIcon?: boolean;
  className?: string;
}

interface PaymentMethodStatusBadgeProps extends StatusBadgeProps {
  status: PaymentMethodStatus;
}

interface PayoutStatusBadgeProps extends StatusBadgeProps {
  status: PayoutStatus;
}

interface KYCStatusBadgeProps extends StatusBadgeProps {
  status: KYCStatus;
  level?: "basic" | "full";
}

export function PaymentMethodStatusBadge({
  status,
  showIcon = true,
  className
}: PaymentMethodStatusBadgeProps) {
  const config = paymentMethodStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

export function PayoutStatusBadge({ status, showIcon = true, className }: PayoutStatusBadgeProps) {
  const config = payoutStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

export function KYCStatusBadge({ status, level, showIcon = true, className }: KYCStatusBadgeProps) {
  const config = kycStatusConfig[status];
  const levelLabel = level ? ` (${level === "basic" ? "Basic" : "Full"})` : "";

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
      {status === "approved" && levelLabel}
    </Badge>
  );
}
