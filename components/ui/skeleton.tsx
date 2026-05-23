import { cn } from '@/lib/utils';

interface SkeletonProps { className?: string }

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      'animate-pulse rounded-lg bg-[var(--border-subtle)]',
      className,
    )} />
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-[var(--border-subtle)] w-full"
      style={{ height }}
    />
  );
}
