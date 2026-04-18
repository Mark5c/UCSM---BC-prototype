import { useState, useRef } from 'react'
import type { Step } from '../../types'
import { StepItem } from './StepItem'
import type { ValidationIssue } from '../../types'

// Inline UUID generator (no extra dep)
function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface StepListProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
  issues?: ValidationIssue[]
  fieldPrefix?: string
  actors?: string[]
  highlightedStepIds?: Set<string>
  highlightUsername?: string
}

export function StepList({ steps, onChange, issues = [], fieldPrefix = 'mainFlow', actors = [], highlightedStepIds, highlightUsername }: StepListProps) {
  const [newStepIndex, setNewStepIndex] = useState<number | null>(null)
  const focusedIndexRef = useRef<number>(0)

  const addStep = (afterIndex?: number) => {
    const newStep: Step = { id: newId(), order: 0, text: '' }
    let newSteps: Step[]
    if (afterIndex !== undefined) {
      newSteps = [
        ...steps.slice(0, afterIndex + 1),
        newStep,
        ...steps.slice(afterIndex + 1),
      ]
      setNewStepIndex(afterIndex + 1)
    } else {
      newSteps = [...steps, newStep]
      setNewStepIndex(steps.length)
    }
    onChange(newSteps.map((s, i) => ({ ...s, order: i + 1 })))
  }

  const updateStep = (index: number, text: string) => {
    onChange(steps.map((s, i) => i === index ? { ...s, text } : s))
  }

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    onChange(newSteps.map((s, i) => ({ ...s, order: i + 1 })))
    setNewStepIndex(null)
  }

  const insertActor = (actor: string) => {
    const idx = focusedIndexRef.current
    if (idx < 0 || idx >= steps.length) return
    const step = steps[idx]
    const text = step.text.trim()
    const newText = text ? `${actor} ${text}` : `${actor} `
    onChange(steps.map((s, i) => i === idx ? { ...s, text: newText } : s))
  }

  return (
    <div>
      {actors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-xs text-slate-400">Aktéri:</span>
          {actors.map(actor => (
            <button
              key={actor}
              type="button"
              onClick={() => insertActor(actor)}
              className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full hover:bg-teal-100 transition-colors"
            >
              {actor}
            </button>
          ))}
        </div>
      )}
      {steps.length === 0 ? (
        <button
          onClick={() => addStep()}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-teal-600 border border-dashed border-slate-200 hover:border-teal-300 rounded-md hover:bg-teal-50/50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Pridať krok
        </button>
      ) : (
        <div className="space-y-0.5">
          {steps.map((step, i) => (
            <StepItem
              key={step.id}
              step={step}
              index={i}
              onChange={text => updateStep(i, text)}
              onDelete={() => deleteStep(i)}
              onAddAfter={() => addStep(i)}
              onFocus={() => { focusedIndexRef.current = i }}
              hasError={issues.some(iss => iss.field === `${fieldPrefix}[${i}]` && iss.severity === 'error')}
              hasWarning={issues.some(iss => iss.field === `${fieldPrefix}[${i}]` && iss.severity === 'warning')}
              autoFocus={newStepIndex === i}
              highlighted={highlightedStepIds?.has(step.id)}
              highlightUsername={highlightUsername}
            />
          ))}
          <button
            onClick={() => addStep(steps.length - 1)}
            className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 py-1 px-2 rounded hover:bg-teal-50/50"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Pridať krok
          </button>
        </div>
      )}
    </div>
  )
}
