import { cn } from '@/lib/utils';

type Variant = 'fresh' | 'early' | 'confirmed' | 'obvious' | 'default' | 'active' | 'paused';

const styles: Record<Variant, string> = {
  fresh:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  early:     'bg-amber-500/10   text-amber-400   border-amber-500/20',
  confirmed: 'bg-orange-500/10  text-orange-400  border-orange-500/20',
  obvious:   'bg-red-500/10     text-red-400     border-red-500/20',
  default:   'bg-slate-700/40   text-slate-300   border-slate-600/30',
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused:    'bg-slate-700/40   text-slate-400   border-slate-600/30',
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
