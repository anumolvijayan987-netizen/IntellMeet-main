import React from 'react'
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs">
          {variant === 'danger' ? (
            <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#F04438] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
          )}
          <p className="text-xs text-[#475467] leading-relaxed mt-1">{description}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
