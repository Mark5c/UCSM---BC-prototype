import { useState } from 'react'
import type { BasicFlow, Step, ValidationIssue } from '../../types'
import { StepList } from './StepList'

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface Props {
  flows: BasicFlow[]
  onChange: (flows: BasicFlow[]) => void
  actors?: string[]
  issues?: ValidationIssue[]
}

export function BasicFlowList({ flows, onChange, actors = [], issues = [] }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(flows.map(f => f.id))
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

  const addFlow = () => {
    const id = newId()
    const name = `Základný tok ${flows.length + 1}`
    onChange([...flows, { id, name, steps: [] }])
    setExpanded(prev => new Set([...prev, id]))
    setEditingId(id)
    setNameInput(name)
  }

  const deleteFlow = (id: string) => {
    onChange(flows.filter(f => f.id !== id))
    setExpanded(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const commitRename = (id: string) => {
    const trimmed = nameInput.trim()
    if (trimmed) onChange(flows.map(f => f.id === id ? { ...f, name: trimmed } : f))
    setEditingId(null)
  }

  const changeSteps = (id: string, steps: Step[]) => {
    onChange(flows.map(f => f.id === id ? { ...f, steps } : f))
  }

  return (
    <div className="space-y-3">
      {flows.length === 0 && (
        <p className="text-xs text-slate-400 italic">Žiadne základné toky. Pridajte prvý základný tok.</p>
      )}

      {flows.map((flow, idx) => (
        <div key={flow.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100 cursor-pointer"
            onClick={() => toggle(flow.id)}
          >
            <span className="flex-shrink-0 text-slate-400">
              <svg
                className={`w-3.5 h-3.5 transition-transform ${expanded.has(flow.id) ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>

            <span className="text-xs font-mono text-slate-400 flex-shrink-0">ZT{idx + 1}.</span>

            {editingId === flow.id ? (
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onClick={e => e.stopPropagation()}
                onBlur={() => commitRename(flow.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(flow.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                className="flex-1 text-sm font-medium text-slate-800 bg-white border border-teal-400 rounded px-1.5 py-0.5 outline-none"
                autoFocus
              />
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setEditingId(flow.id); setNameInput(flow.name) }}
                className="flex-shrink-0 text-left text-sm font-medium text-slate-700 hover:text-teal-700 truncate"
                title="Kliknite pre premenovanie"
              >
                {flow.name}
              </button>
            )}

            <span className="flex-1" />

            <span className="text-xs text-slate-400 font-mono flex-shrink-0">{flow.steps.length}</span>

            {flows.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); deleteFlow(flow.id) }}
                className="flex-shrink-0 p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                title="Odstrániť tok"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Steps */}
          {expanded.has(flow.id) && (
            <div className="px-3 py-3">
              <StepList
                steps={flow.steps}
                onChange={steps => changeSteps(flow.id, steps)}
                fieldPrefix={`basicFlows[${idx}]`}
                actors={actors}
                issues={issues}
              />
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addFlow}
        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-teal-600 border border-dashed border-slate-200 hover:border-teal-300 rounded-md hover:bg-teal-50/50 w-full transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Pridať základný tok
      </button>
    </div>
  )
}
