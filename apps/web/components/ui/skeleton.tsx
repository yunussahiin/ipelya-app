import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  [key: string]: any;
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
