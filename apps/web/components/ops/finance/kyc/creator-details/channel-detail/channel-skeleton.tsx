"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function ChannelDetailSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="px-6 pt-6 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg border text-center">
              <Skeleton className="h-3.5 w-3.5 mx-auto mb-0.5" />
              <Skeleton className="h-5 w-10 mx-auto mb-0.5" />
              <Skeleton className="h-2.5 w-8 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg bg-muted/50 text-center">
              <Skeleton className="h-5 w-8 mx-auto mb-0.5" />
              <Skeleton className="h-2.5 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Messages Skeleton */}
      <div className="flex-1 px-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tl-sm" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
