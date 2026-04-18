import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: boolean
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`field-input ${error ? 'field-input-error' : ''} ${className}`}
          {...props}
        />
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
