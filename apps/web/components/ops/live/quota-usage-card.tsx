"use client";

/**
 * LiveKit Kota Kullanım Kartı
 * LiveKit hesap limitlerini ve kullanımını gösterir
 */

import { AlertTriangle, CheckCircle, Clock, Users, Video, Mic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface QuotaData {
  // Participant Limits
  currentParticipants: number;
  maxParticipants: number;

  // Room Limits
  currentRooms: number;
  maxRooms: number;

  // Bandwidth (GB)
  bandwidthUsedGB: number;
  bandwidthLimitGB: number;

  // Recording Minutes
  recordingUsedMinutes: number;
  recordingLimitMinutes: number;

  // Egress Hours
  egressUsedHours: number;
  egressLimitHours: number;

  // Plan Info
  planName: string;
  billingCycle: string;
  daysRemaining: number;
}

interface QuotaUsageCardProps {
  data: QuotaData;
}

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return "text-red-500";
  if (percentage >= 75) return "text-orange-500";
  if (percentage >= 50) return "text-yellow-500";
  return "text-green-500";
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-orange-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-green-500";
}

function UsageItem({
  icon,
  label,
  current,
  max,
  unit = ""
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  max: number;
  unit?: string;
}) {
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const colorClass = getUsageColor(percentage);
  const progressColor = getProgressColor(percentage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${colorClass}`}>
            {current.toLocaleString()}
            {unit}
          </span>
          <span className="text-xs text-muted-foreground">
            / {max.toLocaleString()}
            {unit}
          </span>
          {percentage >= 90 && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        // @ts-expect-error - custom indicator style
        indicatorClassName={progressColor}
      />
    </div>
  );
}

export function QuotaUsageCard({ data }: QuotaUsageCardProps) {
  const overallUsage = Math.max(
    (data.currentParticipants / data.maxParticipants) * 100,
    (data.currentRooms / data.maxRooms) * 100,
    (data.bandwidthUsedGB / data.bandwidthLimitGB) * 100
  );

  const isHealthy = overallUsage < 75;
  const isWarning = overallUsage >= 75 && overallUsage < 90;
  const isCritical = overallUsage >= 90;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              LiveKit Kota Kullanımı
              {isHealthy && <CheckCircle className="h-5 w-5 text-green-500" />}
              {isWarning && <AlertTriangle className="h-5 w-5 text-orange-500" />}
              {isCritical && <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />}
            </CardTitle>
            <CardDescription>
              {data.planName} Plan • {data.daysRemaining} gün kaldı
            </CardDescription>
          </div>
          <Badge variant={isCritical ? "destructive" : isWarning ? "secondary" : "default"}>
            {data.billingCycle}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Realtime Metrics */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Anlık Kullanım</h4>
          <div className="space-y-4">
            <UsageItem
              icon={<Users className="h-4 w-4 text-blue-500" />}
              label="Aktif Katılımcı"
              current={data.currentParticipants}
              max={data.maxParticipants}
            />
            <UsageItem
              icon={<Video className="h-4 w-4 text-purple-500" />}
              label="Aktif Oda"
              current={data.currentRooms}
              max={data.maxRooms}
            />
          </div>
        </div>

        {/* Monthly Metrics */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Aylık Kullanım</h4>
          <div className="space-y-4">
            <UsageItem
              icon={<Clock className="h-4 w-4 text-green-500" />}
              label="Bant Genişliği"
              current={data.bandwidthUsedGB}
              max={data.bandwidthLimitGB}
              unit=" GB"
            />
            <UsageItem
              icon={<Mic className="h-4 w-4 text-orange-500" />}
              label="Kayıt Süresi"
              current={data.recordingUsedMinutes}
              max={data.recordingLimitMinutes}
              unit=" dk"
            />
            <UsageItem
              icon={<Video className="h-4 w-4 text-red-500" />}
              label="Egress"
              current={data.egressUsedHours}
              max={data.egressLimitHours}
              unit=" saat"
            />
          </div>
        </div>

        {/* Warnings */}
        {isCritical && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <strong>Kritik:</strong> Kota limitine yaklaşıyorsunuz! Plan yükseltmeyi düşünün.
            </p>
          </div>
        )}

        {isWarning && !isCritical && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
            <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <strong>Uyarı:</strong> Kota kullanımı %75&apos;in üzerinde.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default/Mock data for preview
export const defaultQuotaData: QuotaData = {
  currentParticipants: 45,
  maxParticipants: 100,
  currentRooms: 8,
  maxRooms: 20,
  bandwidthUsedGB: 150,
  bandwidthLimitGB: 500,
  recordingUsedMinutes: 1200,
  recordingLimitMinutes: 3000,
  egressUsedHours: 15,
  egressLimitHours: 50,
  planName: "Pro",
  billingCycle: "Aylık",
  daysRemaining: 18
};
