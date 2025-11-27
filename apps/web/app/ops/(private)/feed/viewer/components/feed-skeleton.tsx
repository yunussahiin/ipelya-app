/**
 * FeedSkeleton Component
 * Feed loading state - skeleton kartlar
 */

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedSkeletonProps {
  columns?: number;
  count?: number;
}

export function FeedSkeleton({ columns = 3, count = 6 }: FeedSkeletonProps) {
  const gridCols =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {/* Header Skeleton */}
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardHeader>

          {/* Content Skeleton - alternating between image and text */}
          {i % 3 === 0 ? (
            // Post with image
            <Skeleton className="aspect-square w-full" />
          ) : i % 3 === 1 ? (
            // Mini post (vibe card)
            <div className="mx-4 mb-4">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            // Poll
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          )}

          {/* Footer Skeleton */}
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
