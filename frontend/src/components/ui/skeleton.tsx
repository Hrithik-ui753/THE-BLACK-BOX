import * as React from 'react'
import { cn } from '@/utils/cn'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} style={style} />
}
