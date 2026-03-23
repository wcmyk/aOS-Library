import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'default' | 'sm'
}

const variantClasses = {
  default: 'border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/15',
  primary: 'border-primary/30 bg-primary/15 text-primary hover:bg-primary/25',
  ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-white/10',
}

const sizeClasses = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 rounded-lg px-3',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', ...props },
  ref,
) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
