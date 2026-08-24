import { motion } from 'framer-motion'

const statusStyles: Record<string, { bg: string; text: string; dot: string; pulse?: boolean }> = {
  pending: { bg: 'bg-surface-100', text: 'text-surface-700', dot: 'bg-surface-400', pulse: true },
  confirmed: { bg: 'bg-info/10', text: 'text-blue-700', dot: 'bg-info' },
  preparing: { bg: 'bg-warning/10', text: 'text-amber-700', dot: 'bg-warning', pulse: true },
  ready: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  picked_up: { bg: 'bg-primary-100', text: 'text-primary-700', dot: 'bg-primary-500' },
  on_the_way: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500', pulse: true },
  delivered: { bg: 'bg-success/10', text: 'text-green-700', dot: 'bg-success' },
  cancelled: { bg: 'bg-danger/10', text: 'text-red-700', dot: 'bg-danger' },
  refunded: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
}

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.pending
  const label = status.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {style.pulse && (
          <motion.span
            className={`absolute inline-flex h-full w-full rounded-full ${style.dot}`}
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
      </span>
      {label}
    </span>
  )
}