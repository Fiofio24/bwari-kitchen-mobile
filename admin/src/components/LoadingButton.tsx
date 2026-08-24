import { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: ReactNode
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost'
}

export default function LoadingButton({
  loading, children, variant = 'primary', className = '', disabled, ...props
}: LoadingButtonProps) {
  const baseStyle = 'flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
  const variantStyle = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25',
    danger: 'bg-danger text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
    secondary: 'border border-surface-200 text-surface-700 hover:bg-surface-50',
    ghost: '',
  }[variant]

  return (
    <motion.button
      {...(props as any)}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </motion.button>
  )
}