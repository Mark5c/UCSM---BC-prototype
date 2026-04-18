import React, { useRef, useEffect } from 'react'
import type { Step } from '../../types'

interface StepItemProps {
  step: Step
  index: number
  onChange: (text: string) => void
  onDelete: () => void
  onAddAfter: () => void
  onFocus?: () => void
  hasError?: boolean
  hasWarning?: boolean
  autoFocus?: boolean
  highlighted?: boolean
  highlightUsername?: string
}

export function StepItem({
  step, index, onChange, onDelete, onAddAfter, onFocus, hasError, hasWarning, autoFocus,
  highlighted, highlightUsername,
}: StepItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAddAfter()
    } else if (e.key === 'Backspace' && step.text === '') {
      e.preventDefault()
      onDelete()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
    onChange(el.value)
  }

  const borderClass = highlighted
    ? 'border-l-2 border-amber-400 bg-amber-50/50'
    : hasError
    ? 'border-l-2 border-red-400 bg-red-50/50'
    : hasWarning
    ? 'border-l-2 border-amber-400 bg-amber-50/50'
    : 'border-l-2 border-transparent hover:border-slate-200'

  return (
    <div className={`group flex items-start gap-2 px-2 py-1 rounded ${borderClass}`}>
      {/* Step number */}
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1.5 text-2xs font-mono font-medium text-slate-400 bg-slate-100 rounded">
        {index + 1}
      </span>

      {/* Highlight badge */}
      {highlighted && highlightUsername && (
        <span className="text-2xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-1 py-0.5 font-medium flex-shrink-0 mt-1.5">
          ✏ {highlightUsername}
        </span>
      )}

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={step.text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder="Aktér sloveso..."
        rows={1}
        className="flex-1 text-sm text-slate-700 bg-transparent border-none outline-none resize-none leading-relaxed py-1.5 placeholder-slate-300"
        style={{ minHeight: '32px' }}
      />

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 mt-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-50"
        tabIndex={-1}
        title="Odstrániť krok"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
