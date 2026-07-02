import { useState } from 'react'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-3">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <LoadingButton
            loading={loading}
            variant="danger"
            onClick={() => onConfirm(reason)}
            className="px-4 py-2"
          >
            Confirm Cancellation
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}