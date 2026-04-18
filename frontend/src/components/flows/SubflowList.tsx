import { useState } from 'react'
import type { Subflow, Step, ValidationIssue } from '../../types'
import { StepList } from './StepList'

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface Props {
  subflows: Subflow[]
  onChange: (subflows: Subflow[]) => void
  actors?: string[]
  issues?: ValidationIssue[]
}

export function SubflowList({ subflows, onChange, actors = [], issues = [] }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(subflows.map(s => s.id))
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addSubflow = () => {
    const id = newId()
    const label = `S${subflows.length + 1}`
    const name = `Podtok ${subflows.length + 1}`
    const next = [...subflows, { id, label, name, steps: [] }]
    onChange(next)
    setExpanded(prev => new Set([...prev, id]))
    setEditingId(id)
    setNameInput(name)
  }

  const deleteSubflow = (id: string) => {
    // Re-label remaining subflows S1, S2, …
    const remaining = subflows.filter(s => s.id !== id)
    onChange(remaining.map((s, i) => ({ ...s, label: `S${i + 1}` })))
    setExpanded(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  const commitRename = (id: string) => {
    const trimmed = nameInput.trim()
    if (trimmed) onChange(subflows.map(s => s.id === id ? { ...s, name: trimmed } : s))
    setEditingId(null)
  }

  const changeSteps = (id: string, steps: Step[]) => {
    onChange(subflows.map(s => s.id === id ? { ...s, steps } : s))
  }

  return (
    <div className="space-y-3">
      {subflows.length === 0 && (
        <p className="text-xs text-slate-400 italic">Žiadne podtoky. Pridajte prvý podtok.</p>
      )}

      {subflows.map((sf, idx) => (
        <div key={sf.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100 cursor-pointer"
            onClick={() => toggle(sf.id)}
          >
            <span className="flex-shrink-0 text-slate-400">
              <svg
                className={`w-3.5 h-3.5 transition-transform ${expanded.has(sf.id) ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>

            <span className="text-xs font-bold font-mono text-slate-500 flex-shrink-0">
              S{idx + 1}.
            </span>

            {editingId === sf.id ? (
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onClick={e => e.stopPropagation()}
                onBlur={() => commitRename(sf.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(sf.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 text-sm font-medium text-slate-800 bg-white border border-teal-400 rounded px-1.5 py-0.5 outline-none"
                autoFocus
              />
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setEditingId(sf.id); setNameInput(sf.name) }}
                className="flex-shrink-0 text-left text-sm font-medium text-slate-700 hover:text-teal-700 truncate"
                title="Kliknite pre premenovanie"
              >
                {sf.name}
              </button>
            )}

            <span className="flex-1" />

            <span className="text-xs text-slate-400 font-mono flex-shrink-0">{sf.steps.length}</span>

            <button
              onClick={e => { e.stopPropagation(); deleteSubflow(sf.id) }}
              className="flex-shrink-0 p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Odstrániť podtok"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Steps */}
          {expanded.has(sf.id) && (
            <div className="px-3 py-3">
              <StepList
                steps={sf.steps}
                onChange={steps => changeSteps(sf.id, steps)}
                fieldPrefix={`subflows[${idx}]`}
                actors={actors}
                issues={issues}
              />
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addSubflow}
        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-teal-600 border border-dashed border-slate-200 hover:border-teal-300 rounded-md hover:bg-teal-50/50 w-full transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Pridať podtok
      </button>
    </div>
  )
}
