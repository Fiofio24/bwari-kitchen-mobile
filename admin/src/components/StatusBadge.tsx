const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { bg: 'bg-amber-100', text: 'text-amber-700' },
  ready: { bg: 'bg-purple-100', text: 'text-purple-700' },
  picked_up: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  on_the_way: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
  refunded: { bg: 'bg-orange-100', text: 'text-orange-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.pending
  const label = status.replace(/_/g, ' ')

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  )
}