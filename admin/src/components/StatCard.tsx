import { ReactNode, useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: ReactNode
  accent?: 'primary' | 'success' | 'warning' | 'danger'
}

const accentStyles: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success/10 text-green-600',
  warning: 'bg-warning/10 text-amber-600',
  danger: 'bg-danger/10 text-red-600',
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())
  const [text, setText] = useState('0')

  useEffect(() => {
    spring.set(value)
    const unsub = display.on('change', (v) => setText(v))
    return () => unsub()
  }, [value, spring, display])

  return <>{text}</>
}

export default function StatCard({ label, value, subtext, icon, accent = 'primary' }: StatCardProps) {
  const isNumeric = typeof value === 'number'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:shadow-surface-900/5 p-5 border border-surface-100 transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-surface-500 text-sm font-medium">{label}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentStyles[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-surface-900 tabular-nums">
        {isNumeric ? <AnimatedNumber value={value} /> : value}
      </div>
      {subtext && <div className="text-xs text-surface-400 mt-1">{subtext}</div>}
    </motion.div>
  )
}