'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} title={title} size="sm">
      <div className="space-y-4">
        {description && (
          <div className="text-sm text-gray-700 dark:text-gray-300">{description}</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={async () => {
              try {
                setBusy(true)
                await onConfirm()
              } finally {
                setBusy(false)
              }
            }}
            className={`px-4 py-2 rounded-md text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}


