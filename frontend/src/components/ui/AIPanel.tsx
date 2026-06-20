import { BrainCircuit } from 'lucide-react'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  title?: string
  children: ReactNode
  loading?: boolean
  className?: string
}

export default function AIPanel({ title = 'AI Analysis', children, loading, className }: Props) {
  return (
    <div className={clsx('rounded-xl border border-brand-500/30 bg-brand-500/5 p-5', className)}>
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit size={16} className="text-brand-400" />
        <span className="text-sm font-semibold text-brand-400">{title}</span>
        {loading && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-3 h-3 border border-brand-400 border-t-transparent rounded-full animate-spin" />
            Claude is thinking…
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
