import { cn } from '../../lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  className?: string
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export function Avatar({ src, name, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('h-10 w-10 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-medium text-white',
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
