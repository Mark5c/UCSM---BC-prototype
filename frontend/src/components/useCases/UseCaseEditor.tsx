import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { UseCase, Relationship } from '../../types'
import { useUseCases } from '../../context/UseCaseContext'
import { useProject } from '../../context/ProjectContext'
import { validateUseCase } from '../../utils/validation'
import { TemplateSelector } from './TemplateSelector'
import { CockburnTemplate } from './CockburnTemplate'
import { JacobsonTemplate } from './JacobsonTemplate'
import { FlowEditor } from '../flows/FlowEditor'
import { RelationshipPanel } from '../relationships/RelationshipPanel'
import { ValidationPanel } from '../validation/ValidationPanel'
import { ValidationBadge } from '../validation/ValidationBadge'
import { TagInput } from '../common/TagInput'

interface SectionProps {
  title: string
  children: React.ReactNode
  badge?: React.ReactNode
}

function Section({ title, children, badge }: SectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <h3 className="section-header">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  )
}

function HighlightBadge({ username }: { username: string }) {
  return (
    <span className="ml-2 text-2xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 font-medium">
      ✏ {username}
    </span>
  )
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function UseCaseEditor() {
  const { activeUseCase, updateUseCase, useCases, highlights, setHighlights } = useUseCases()
  const { activeProject } = useProject()
  const [draft, setDraft] = useState<UseCase | null>(null)
  const [saveError, setSaveError] = useState('')
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const lastSavedRef = useRef<string>('')

  // Clear highlights when switching to a different use case
  useEffect(() => {
    if (highlights && activeUseCase?.id !== highlights.useCaseId) {
      setHighlights(null)
    }
  }, [activeUseCase?.id])

  const hl = (field: string) => !!(highlights && highlights.useCaseId === draft?.id && highlights.fields.includes(field))

  // Sync draft when activeUseCase changes from external source
  useEffect(() => {
    if (activeUseCase) {
      setDraft(activeUseCase)
      lastSavedRef.current = JSON.stringify(activeUseCase)
    }
  }, [activeUseCase?.id]) // Only reset draft when UC changes, not on every remote update

  // Merge remote updates into draft without clobbering local edits
  useEffect(() => {
    if (!activeUseCase || !draft) return
    if (activeUseCase.id !== draft.id) return
    // If remote version is newer than what we last saved, apply it
    if (activeUseCase.version > draft.version) {
      setDraft(activeUseCase)
      lastSavedRef.current = JSON.stringify(activeUseCase)
    }
  }, [activeUseCase?.version])

  const debouncedDraft = useDebounce(draft, 600)

  // Auto-save when debounced draft changes
  useEffect(() => {
    if (!debouncedDraft || !activeProject) return
    const serialized = JSON.stringify(debouncedDraft)
    if (serialized === lastSavedRef.current) return

    const save = async () => {
      try {
        setSaveError('')
        await updateUseCase(activeProject.id, debouncedDraft)
        lastSavedRef.current = serialized
      } catch {
        setSaveError('Nepodarilo sa uložiť')
      }
    }
    save()
  }, [debouncedDraft])

  const update = useCallback((partial: Partial<UseCase>) => {
    setHighlights(null)
    setDraft(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  const issues = draft ? validateUseCase(draft, { relationships, allUseCases: useCases }) : []

  const highlightedStepIds = useMemo(() => {
    if (!highlights || highlights.useCaseId !== draft?.id) return undefined
    const ids = new Set<string>()
    for (const f of highlights.fields) {
      const m = f.match(/^main_flow\.(.+)$/)
      if (m) ids.add(m[1])
    }
    return ids.size > 0 ? ids : undefined
  }, [highlights, draft?.id])

  const highlightedAltFlowIds = useMemo(() => {
    if (!highlights || highlights.useCaseId !== draft?.id) return undefined
    const ids = new Set<string>()
    for (const f of highlights.fields) {
      const m = f.match(/^alternative_flows\.(.+)$/)
      if (m) ids.add(m[1])
    }
    return ids.size > 0 ? ids : undefined
  }, [highlights, draft?.id])

  if (!draft) return null

  return (
    <div className="flex flex-col h-full">
      {/* Save status bar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          {saveError && (
            <>
              <span className="w-3.5 h-3.5 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-xs text-red-500">{saveError}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {issues.filter(i => i.severity === 'error').length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
              {issues.filter(i => i.severity === 'error').length} chýb
            </span>
          )}
          {issues.filter(i => i.severity === 'warning').length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full font-medium">
              {issues.filter(i => i.severity === 'warning').length} upozornení
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">

          {/* ── Name ── */}
          <div className={hl('name') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
            <label className="field-label flex items-center">
              Názov
              <ValidationBadge issues={issues} field="name" />
              {hl('name') && <HighlightBadge username={highlights!.username} />}
            </label>
            <input
              value={draft.name}
              onChange={e => update({ name: e.target.value })}
              className={`field-input text-base font-medium ${issues.some(i => i.field === 'name' && i.severity === 'error') ? 'field-input-error' : ''}`}
              placeholder="Názov prípadu použitia"
            />
          </div>

          {/* ── Template selector ── */}
          <TemplateSelector
            value={draft.templateType}
            onChange={templateType => update({ templateType })}
          />

          {/* ── Core fields ── */}
          <Section title="Základné informácie">
            <div className="grid grid-cols-1 gap-4">
              <div className={hl('primary_actor') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
                <label className="field-label flex items-center">
                  Primárny aktér
                  <ValidationBadge issues={issues} field="primaryActor" />
                  {hl('primary_actor') && <HighlightBadge username={highlights!.username} />}
                </label>
                <input
                  value={draft.primaryActor}
                  onChange={e => update({ primaryActor: e.target.value })}
                  className={`field-input ${issues.some(i => i.field === 'primaryActor' && i.severity === 'error') ? 'field-input-error' : ''}`}
                  placeholder="Napr. Zákazník, Administrátor..."
                />
              </div>

              <div className={hl('supporting_actors') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
                {hl('supporting_actors') && <div className="flex justify-end mb-1"><HighlightBadge username={highlights!.username} /></div>}
                <TagInput
                  label="Podporní aktéri"
                  value={draft.supportingActors}
                  onChange={supportingActors => update({ supportingActors })}
                  placeholder="Pridať aktéra..."
                />
              </div>

              <div className={hl('goal') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
                <label className="field-label flex items-center">
                  Cieľ
                  <ValidationBadge issues={issues} field="goal" />
                  {hl('goal') && <HighlightBadge username={highlights!.username} />}
                </label>
                <textarea
                  value={draft.goal}
                  onChange={e => update({ goal: e.target.value })}
                  rows={2}
                  className={`field-input resize-none ${issues.some(i => i.field === 'goal' && i.severity === 'error') ? 'field-input-error' : ''}`}
                  placeholder="Čo chce aktér dosiahnuť?"
                />
              </div>
            </div>
          </Section>

          {/* ── Pre/Post conditions ── */}
          <Section title="Podmienky">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={hl('preconditions') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
                {hl('preconditions') && <div className="flex justify-end mb-1"><HighlightBadge username={highlights!.username} /></div>}
                <TagInput
                  label="Predpodmienky"
                  value={draft.preconditions}
                  onChange={preconditions => update({ preconditions })}
                  placeholder="Pridať predpodmienku..."
                  error={issues.some(i => i.field === 'preconditions' && i.severity === 'error')}
                />
              </div>
              <div className={hl('postconditions') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
                {hl('postconditions') && <div className="flex justify-end mb-1"><HighlightBadge username={highlights!.username} /></div>}
                <TagInput
                  label="Postpodmienky"
                  value={draft.postconditions}
                  onChange={postconditions => update({ postconditions })}
                  placeholder="Pridať postpodmienku..."
                  error={issues.some(i => i.field === 'postconditions' && i.severity === 'error')}
                />
              </div>
            </div>
          </Section>

          {/* ── Template-specific extras ── */}
          {draft.templateType === 'cockburn' && (
            <Section title="Rozšírené polia (Cockburn)">
              <CockburnTemplate
                extras={draft.templateExtras}
                onChange={templateExtras => update({ templateExtras })}
                hl={field => hl(`template_extras.${field}`)}
                highlightUsername={highlights?.username}
              />
            </Section>
          )}

          {draft.templateType === 'jacobson' && (
            <Section title="Rozšírené polia (Jacobson)">
              <JacobsonTemplate
                extras={draft.templateExtras}
                onChange={templateExtras => update({ templateExtras })}
                hl={field => hl(`template_extras.${field}`)}
                highlightUsername={highlights?.username}
              />
            </Section>
          )}

          {/* ── Flows ── */}
          <Section
            title="Toky"
            badge={draft.templateType === 'cockburn' ? <ValidationBadge issues={issues} field="mainFlow" /> : undefined}
          >
            <FlowEditor
              mainFlow={draft.mainFlow}
              alternativeFlows={draft.alternativeFlows}
              onChangeMainFlow={mainFlow => update({ mainFlow })}
              onChangeAlternativeFlows={alternativeFlows => update({ alternativeFlows })}
              issues={issues}
              actors={[draft.primaryActor, ...draft.supportingActors].filter(a => a.trim())}
              highlightedStepIds={highlightedStepIds}
              highlightedAltFlowIds={highlightedAltFlowIds}
              highlightUsername={highlights?.username}
              templateType={draft.templateType}
              basicFlows={draft.templateExtras.basicFlows ?? []}
              subflows={draft.templateExtras.subflows ?? []}
              jacobsonAltFlows={draft.templateExtras.jacobsonAltFlows ?? []}
              onChangeBasicFlows={basicFlows => update({ templateExtras: { ...draft.templateExtras, basicFlows } })}
              onChangeSubflows={subflows => update({ templateExtras: { ...draft.templateExtras, subflows } })}
              onChangeJacobsonAltFlows={jacobsonAltFlows => update({ templateExtras: { ...draft.templateExtras, jacobsonAltFlows } })}
            />
          </Section>

          {/* ── Relationships ── */}
          <Section title="Vzťahy">
            <RelationshipPanel useCases={useCases} currentUcId={draft.id} onRelationshipsChange={setRelationships} />
          </Section>

          {/* ── Validation ── */}
          <Section title="Validácia">
            <ValidationPanel issues={issues} />
          </Section>

        </div>
      </div>
    </div>
  )
}
