import React, { useState, useRef, KeyboardEvent } from 'react'

interface TagInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  error?: boolean
}

export function TagInput({ label, value, onChange, placeholder = 'Pridať...', error }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <div
        className={`
          min-h-[38px] w-full px-2 py-1.5 text-sm bg-white border rounded-md
          flex flex-wrap gap-1.5 cursor-text
          ${error
            ? 'border-red-300 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400/20'
            : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500/30'
          }
          hover:border-slate-300
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(i) }}
              className="text-slate-400 hover:text-slate-600 ml-0.5"
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue) }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm placeholder-slate-400 py-0.5"
        />
      </div>
      <p className="mt-1 text-2xs text-slate-400">Potvrdiť Enterom alebo čiarkou</p>
    </div>
  )
}
