'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border rounded-lg shadow-lg max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onCancel}
              className="h-6 w-6 rounded-full hover:bg-accent flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                className="min-w-20"
              >
                {cancelText}
                <span className="ml-2 text-xs text-muted-foreground">ESC</span>
              </Button>
              <Button
                onClick={onConfirm}
                className="min-w-20"
              >
                {confirmText}
                <span className="ml-2 text-xs text-muted-foreground bg-white/20 px-1 rounded">ENTER</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}