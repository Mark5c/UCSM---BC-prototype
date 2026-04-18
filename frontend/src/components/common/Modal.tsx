import React, { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClass} animate-[fadeIn_0.15s_ease]`}
        style={{ animation: 'modalIn 0.15s ease' }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
