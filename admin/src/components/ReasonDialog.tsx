import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingButton from './LoadingButton'

interface ReasonDialogProps {
  isOpen: boolean
  title: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function ReasonDialog({ isOpen, title, onConfirm, onCancel, loading }: ReasonDialogProps) {
  const [reason, setReason] = useState('')

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
            <h3 className="font-semibold text-lg text-surface-900 mb-3">{title}</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full border border-surface-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
            />
            <div className="flex gap-2 justify-end">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors"
              >
                Cancel
              </motion.button>
              <LoadingButton
                loading={loading}
                variant="danger"
                onClick={() => onConfirm(reason)}
                className="px-4 py-2"
              >
                Confirm Cancellation
              </LoadingButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}