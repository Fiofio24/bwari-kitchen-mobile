import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}

export default function ConfirmDialog({
  isOpen, title, message, onConfirm, onCancel,
  confirmLabel = 'Confirm', danger = false, loading = false
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-surface-900/10 border border-white/50 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {danger && (
              <div className="w-11 h-11 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-danger" />
              </div>
            )}
            <h3 className="font-semibold text-lg text-surface-900 mb-2">{title}</h3>
            <p className="text-sm text-surface-500 mb-6">{message}</p>
            <div className="flex gap-2 justify-end">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-xl hover:bg-surface-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm rounded-xl text-white font-medium disabled:opacity-50 transition-colors ${
                  danger
                    ? 'bg-danger hover:bg-red-600 shadow-lg shadow-red-500/20'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                }`}
              >
                {loading ? 'Please wait...' : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}