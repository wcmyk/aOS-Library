import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'primary'
}

const variantClasses = {
  default: 'border-white/10 bg-white/10 text-slate-200',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  destructive: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  primary: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <div className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', variantClasses[variant], className)} {...props} />
}
