import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-[0_0_20px_var(--color-brand-glow)]',
  secondary:
    'border border-border-light bg-surface-light text-light-primary hover:bg-border-light dark:border-border-dark dark:bg-surface-dark-elevated dark:text-dark-primary dark:hover:bg-border-dark',
  ghost:
    'text-light-secondary hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
