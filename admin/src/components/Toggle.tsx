import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: () => void
}

export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <motion.button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-success' : 'bg-surface-200'
      }`}
      whileTap={{ scale: 0.92 }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm"
        style={{ marginLeft: checked ? 22 : 4 }}
      />
    </motion.button>
  )
}