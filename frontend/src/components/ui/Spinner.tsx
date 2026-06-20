import clsx from 'clsx'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center p-8', className)}>
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
