"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: string;
  icon?: ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  trend,
  icon,
  onClick,
  loading = false
}: MetricCardProps) {
  const isPositive = trend?.startsWith("+");

  return (
    <Card className="cursor-pointer hover:shadow-lg transition" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{loading ? "..." : value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend}
              </p>
            )}
          </div>
          {icon && <div className="text-muted-foreground ml-4">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
