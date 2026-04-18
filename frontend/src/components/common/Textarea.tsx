import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: boolean
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, rows = 3, ...props }, ref) => {
    const inputId = id ?? `textarea-${Math.random().toString(36).slice(2)}`
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`field-input resize-none ${error ? 'field-input-error' : ''} ${className}`}
          {...props}
        />
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
