import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const newToast: ToastItem = { id, type, title, message, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', title: title || 'Success', message })
  }, [showToast])

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', title: title || 'Error', message })
  }, [showToast])

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', title: title || 'Warning', message })
  }, [showToast])

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', title: title || 'Information', message })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-[#F6FEF9] border-[#A6F4C5] text-[#027A48]',
            error: 'bg-[#FFFBFA] border-[#FECDCA] text-[#B42318]',
            warning: 'bg-[#FFFCF5] border-[#FEDF89] text-[#B54708]',
            info: 'bg-[#F5FAFF] border-[#B2DDFF] text-[#175CD3]',
          }

          const iconStyles = {
            success: <CheckCircle2 className="w-4 h-4 text-[#12B76A] shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-4 h-4 text-[#F04438] shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-4 h-4 text-[#F79009] shrink-0 mt-0.5" />,
            info: <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />,
          }

          return (
            <div
              key={t.id}
              className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 pointer-events-auto transition-all animate-fade-in ${
                typeStyles[t.type]
              }`}
            >
              {iconStyles[t.type]}
              <div className="flex-1 space-y-0.5 text-xs">
                {t.title && <div className="font-bold">{t.title}</div>}
                <div className="text-[11px] leading-relaxed opacity-90">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-60 hover:opacity-100 p-0.5 rounded transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
