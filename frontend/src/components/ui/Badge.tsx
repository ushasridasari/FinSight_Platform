import clsx from 'clsx'

interface Props {
  label: string
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
}

const variants = {
  green:  'bg-brand-500/20 text-brand-400',
  red:    'bg-red-500/20 text-red-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
  blue:   'bg-blue-500/20 text-blue-400',
  gray:   'bg-slate-500/20 text-slate-400',
}

export default function Badge({ label, variant = 'gray' }: Props) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {label}
    </span>
  )
}
