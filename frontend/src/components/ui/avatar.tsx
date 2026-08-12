import { cn } from '@/utils/cn'

export interface AvatarProps {
  name: string
  photoURL?: string
  className?: string
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function Avatar({ name, photoURL, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-xs font-semibold text-accent-soft select-none',
        className,
      )}
      aria-label={name}
    >
      {photoURL ? <img src={photoURL} alt={name} className="h-full w-full rounded-full object-cover" /> : initialsOf(name)}
    </div>
  )
}
