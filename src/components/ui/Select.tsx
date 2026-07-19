import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, name, children, ...props }, ref) => {
    const selectId = id ?? name
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={selectId}
          className="text-sm text-light-secondary dark:text-dark-secondary"
        >
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={name}
            className={cn(
              'w-full appearance-none rounded-xl border border-border-light bg-surface-light px-4 py-2.5 pr-10 text-base text-light-primary outline-none transition-all duration-200 focus:border-brand-500',
              'dark:border-border-dark dark:bg-surface-dark-elevated dark:text-dark-primary',
              error && 'border-danger focus:border-danger',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-secondary dark:text-dark-secondary"
          />
        </div>
        {error ? <span className="text-sm text-danger">{error}</span> : null}
      </div>
    )
  },
)
Select.displayName = 'Select'
