import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-6">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50 hover:text-surface-900 transition-colors"
      >
        <ChevronLeft size={15} />
        Previous
      </motion.button>

      <span className="text-sm text-surface-500 font-medium">
        Page <span className="text-surface-900">{page}</span> of {totalPages}
      </span>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50 hover:text-surface-900 transition-colors"
      >
        Next
        <ChevronRight size={15} />
      </motion.button>
    </div>
  )
}