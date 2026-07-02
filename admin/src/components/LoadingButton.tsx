import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: ReactNode
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost'
}

export default function LoadingButton({
  loading, children, variant = 'primary', className = '', disabled, ...props
}: LoadingButtonProps) {
  const baseStyle = 'flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed'

  const variantStyle = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: '',
  }[variant]

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}