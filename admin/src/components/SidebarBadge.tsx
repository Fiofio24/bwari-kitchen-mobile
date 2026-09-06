interface SidebarBadgeProps {
  count: number | string
  variant?: 'primary' | 'warning' | 'success'
}

export default function SidebarBadge({ count, variant = 'primary' }: SidebarBadgeProps) {
  if (!count || count === 0) return null

  const bgColors = {
    primary: 'bg-primary-500 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-emerald-500 text-white',
  }

  return (
    <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${bgColors[variant]}`}>
      {count}
    </span>
  )
}