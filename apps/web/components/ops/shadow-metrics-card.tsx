"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ShadowMetricsCardProps {
  title: string;
  value: number | string;
  description?: string;
  tooltip?: string;
  variant?: "default" | "warning" | "danger" | "success";
}

export function ShadowMetricsCard({
  title,
  value,
  description,
  tooltip,
  variant = "default"
}: ShadowMetricsCardProps) {
  const variantStyles = {
    default: "text-foreground",
    warning: "text-orange-600 dark:text-orange-400",
    danger: "text-red-600 dark:text-red-400",
    success: "text-green-600 dark:text-green-400"
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
