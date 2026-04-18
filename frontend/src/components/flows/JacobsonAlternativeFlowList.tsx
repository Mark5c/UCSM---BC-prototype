import { useState } from 'react'
import type { JacobsonAlternativeFlow, BasicFlow, ValidationIssue } from '../../types'
import { StepList } from './StepList'

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface Props {
  flows: JacobsonAlternativeFlow[]
  basicFlows: BasicFlow[]
  onChange: (flows: JacobsonAlternativeFlow[]) => void
  issues?: ValidationIssue[]
  actors?: string[]
}

export function JacobsonAlternativeFlowList({ flows, basicFlows, onChange, issues = [], actors = [] }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addFlow = () => {
    const id = newId()
    onChange([...flows, { id, label: `A${flows.length + 1}`, name: '', condition: '', steps: [] }])
    setExpanded(prev => new Set([...prev, id]))
    setEditingId(id)
    setNameInput('')
  }

  const updateFlow = (index: number, partial: Partial<JacobsonAlternativeFlow>) => {
    onChange(flows.map((f, i) => i === index ? { ...f, ...partial } : f))
  }

  const deleteFlow = (index: number) => {
    const remaining = flows.filter((_, i) => i !== index)
    onChange(remaining.map((f, i) => ({ ...f, label: `A${i + 1}` })))
  }

  const commitRename = (id: string) => {
    const trimmed = nameInput.trim()
    onChange(flows.map(f => f.id === id ? { ...f, name: trimmed } : f))
    setEditingId(null)
  }

  const handleBasicFlowLink = (index: number, basicFlowId: string) => {
    // Changing basic flow clears the step selection
    updateFlow(index, { triggeredByBasicFlowId: basicFlowId || undefined, triggeredByStepId: undefined })
  }

  const handleStepLink = (index: number, stepId: string) => {
    updateFlow(index, { triggeredByStepId: stepId || undefined })
  }

  return (
    <div className="space-y-2">
      {flows.map((flow, i) => {
        const isExpanded = expanded.has(flow.id)
        const flowIssues = issues.filter(iss => iss.field.startsWith(`jacobsonAltFlows[${i}]`))
        const hasValidationError = flowIssues.some(iss => iss.severity === 'error')

        const linkedBasicFlow = flow.triggeredByBasicFlowId
          ? basicFlows.find(b => b.id === flow.triggeredByBasicFlowId)
          : null
        const isBasicFlowOrphaned = !!flow.triggeredByBasicFlowId && !linkedBasicFlow

        const linkedStep = linkedBasicFlow && flow.triggeredByStepId
          ? linkedBasicFlow.steps.find(s => s.id === flow.triggeredByStepId)
          : null
        const isStepOrphaned = !!flow.triggeredByStepId && !!linkedBasicFlow && !linkedStep

        const isOrphaned = isBasicFlowOrphaned || isStepOrphaned

        const borderClass = isOrphaned
          ? 'border-orange-300'
          : hasValidationError
          ? 'border-red-200'
          : 'border-slate-200'

        return (
          <div key={flow.id} className={`border rounded-lg overflow-hidden ${borderClass}`}>
            {/* Orphan warning */}
            {isOrphaned && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200">
                <svg className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-orange-700 font-medium">
                  {isBasicFlowOrphaned
                    ? 'Prepojený základný tok bol odstránený.'
                    : 'Prepojený krok bol odstránený zo základného toku.'}
                </span>
                <button
                  onClick={() => updateFlow(i, { triggeredByBasicFlowId: undefined, triggeredByStepId: undefined })}
                  className="ml-auto text-xs text-orange-600 hover:text-orange-800 underline flex-shrink-0"
                >
                  Odstrániť prepojenie
                </button>
              </div>
            )}

            {/* Header */}
            <div
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${isOrphaned ? 'bg-orange-50/50' : 'bg-slate-50'}`}
              onClick={() => toggleExpand(flow.id)}
            >
              <span className="flex-shrink-0 text-slate-400">
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>

              {/* Label badge */}
              <span className={`font-mono text-xs font-semibold flex-shrink-0 px-1.5 py-0.5 rounded
                ${isOrphaned
                  ? 'bg-orange-100 text-orange-700'
                  : (linkedBasicFlow || linkedStep)
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-slate-100 text-slate-600'
                }`}
              >
                {flow.label}
              </span>

              {/* Editable name */}
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
                  className="flex-1 text-sm font-medium text-slate-800 bg-white border border-teal-400 rounded px-1.5 py-0.5 outline-none min-w-0"
                  placeholder="Názov toku..."
                  autoFocus
                />
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setEditingId(flow.id); setNameInput(flow.name) }}
                  className="flex-shrink-0 text-left text-sm font-medium text-slate-700 hover:text-teal-700 truncate"
                  title="Kliknite pre premenovanie"
                >
                  {flow.name
                    ? <span className="text-slate-700">{flow.name}</span>
                    : <span className="italic text-slate-300">Bez názvu</span>
                  }
                </button>
              )}

              <span className="flex-1" />

              {/* Step link indicator */}
              {linkedBasicFlow && !isOrphaned && (
                <span className="text-2xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 015.656 0l.828.829a4 4 0 01-5.656 5.656l-1.828-1.829" />
                  </svg>
                  {linkedBasicFlow.name || 'ZT'}
                  {linkedStep && <> › krok {linkedStep.order}</>}
                </span>
              )}

              {(hasValidationError || isOrphaned) && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              )}

              <button
                onClick={e => { e.stopPropagation(); deleteFlow(i) }}
                className="p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded flex-shrink-0"
                title="Odstrániť tok"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 py-3 space-y-3">
                {/* Trigger selectors */}
                {basicFlows.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="field-label">Základný tok</label>
                      <select
                        value={flow.triggeredByBasicFlowId ?? ''}
                        onChange={e => handleBasicFlowLink(i, e.target.value)}
                        className={`field-input ${isBasicFlowOrphaned ? 'field-input-error' : ''}`}
                      >
                        <option value="">— Nepriradený —</option>
                        {basicFlows.map((bf, bfi) => (
                          <option key={bf.id} value={bf.id}>
                            ZT{bfi + 1}. {bf.name || 'Bez názvu'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Krok</label>
                      <select
                        value={flow.triggeredByStepId ?? ''}
                        onChange={e => handleStepLink(i, e.target.value)}
                        disabled={!linkedBasicFlow}
                        className={`field-input disabled:opacity-40 disabled:cursor-not-allowed ${isStepOrphaned ? 'field-input-error' : ''}`}
                      >
                        <option value="">— Nepriradený —</option>
                        {linkedBasicFlow?.steps.map(step => (
                          <option key={step.id} value={step.id}>
                            Krok {step.order}: {step.text ? (step.text.length > 50 ? step.text.slice(0, 50) + '…' : step.text) : '(prázdny)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="field-label">Podmienka</label>
                  <input
                    value={flow.condition}
                    onChange={e => updateFlow(i, { condition: e.target.value })}
                    className={`field-input ${issues.some(iss => iss.field === `jacobsonAltFlows[${i}].condition` && iss.severity === 'error') ? 'field-input-error' : ''}`}
                    placeholder="Ak..."
                  />
                </div>

                <div>
                  <label className="field-label">Kroky</label>
                  <StepList
                    steps={flow.steps}
                    onChange={steps => updateFlow(i, { steps })}
                    issues={issues}
                    fieldPrefix={`jacobsonAltFlows[${i}].steps`}
                    actors={actors}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={addFlow}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-teal-600 border border-dashed border-slate-200 hover:border-teal-300 rounded-md hover:bg-teal-50/50"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Pridať alternatívny tok
      </button>
    </div>
  )
}
