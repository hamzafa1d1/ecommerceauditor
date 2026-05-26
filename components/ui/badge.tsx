import { cn } from '@/lib/utils';

type Variant = 'fresh' | 'early' | 'confirmed' | 'obvious' | 'default' | 'active' | 'paused';

const styles: Record<Variant, string> = {
  fresh:     'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  early:     'bg-amber-500/10   text-amber-600   border-amber-500/20   dark:text-amber-400',
  confirmed: 'bg-orange-500/10  text-orange-600  border-orange-500/20  dark:text-orange-400',
  obvious:   'bg-red-500/10     text-red-600     border-red-500/20     dark:text-red-400',
  default:   'bg-[var(--border)] text-[var(--text-muted)] border-[var(--border-subtle)]',
  active:    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  paused:    'bg-[var(--border)] text-[var(--text-dim)]  border-[var(--border-subtle)]',
};

interface BadgeProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold border',
      styles[variant],
      className,
    )}>
      {children}
    </span>
  );
}

export function FatigueBadge({ stage }: { stage: 1 | 2 | 3 | 4 }) {
  const map: Record<number, { variant: Variant; label: string }> = {
    1: { variant: 'fresh',     label: 'Stage 1 · Fresh' },
    2: { variant: 'early',     label: 'Stage 2 · Early Fatigue' },
    3: { variant: 'confirmed', label: 'Stage 3 · Confirmed' },
    4: { variant: 'obvious',   label: 'Stage 4 · Obvious' },
  };
  const { variant, label } = map[stage];
  return <Badge variant={variant}>{label}</Badge>;
}
