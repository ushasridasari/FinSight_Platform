import clsx from 'clsx'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  padding?: boolean
  title?: string
}

export default function Card({ children, className, padding = true, title }: Props) {
  return (
    <div className={clsx('bg-surface-card border border-surface-border rounded-xl', padding && 'p-5', className)}>
      {title && <h3 className="font-semibold text-white mb-4 text-sm">{title}</h3>}
      {children}
    </div>
  )
}
