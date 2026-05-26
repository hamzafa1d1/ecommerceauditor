import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function Card({ className, children, id }: CardProps) {
  return (
    <div id={id} className={cn('card p-5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('text-sm font-semibold text-[var(--text-primary)]', className)}>{children}</h3>;
}

export function CardMuted({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[var(--text-muted)] mt-0.5">{children}</p>;
}
