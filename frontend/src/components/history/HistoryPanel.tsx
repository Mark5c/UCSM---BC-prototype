import { useEffect, useState } from 'react'
import { projectsApi } from '../../api/projects'
import { formatRelativeTime } from '../../utils/format'
import { useUseCases } from '../../context/UseCaseContext'
import type { HistoryEntry } from '../../types'

interface HistoryPanelProps {
  open: boolean
  onClose: () => void
  projectId: string
}

const ACTION_LABEL: Record<string, string> = {
  created: 'vytvoril',
  updated: 'upravil',
  deleted: 'zmazal',
}

const TARGET_LABEL: Record<string, string> = {
  use_case: 'prípad použitia',
  relationship: 'vzťah',
  project: 'projekt',
}

function ActionIcon({ action }: { action: string }) {
  if (action === 'created') {
    return (
      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
        +
      </span>
    )
  }
  if (action === 'deleted') {
    return (
      <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
        ×
      </span>
    )
  }
  return (
    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0">
      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </span>
  )
}

export function HistoryPanel({ open, onClose, projectId }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { useCases, setActiveUseCase, setHighlights } = useUseCases()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    projectsApi.getHistory(projectId)
      .then(data => setEntries(data))
      .catch(() => setError('Nepodarilo sa načítať históriu'))
      .finally(() => setLoading(false))
  }, [open, projectId])

  const handleEntryClick = (entry: HistoryEntry) => {
    if (entry.action === 'deleted' || !entry.useCaseId) return
    const uc = useCases.find(u => u.id === entry.useCaseId)
    if (!uc) return
    setActiveUseCase(uc)

    if (entry.targetType === 'use_case') {
      if (entry.changedFields?.length) {
        setHighlights({ useCaseId: uc.id, fields: entry.changedFields, username: entry.username })
      } else {
        setHighlights(null)
      }
    } else if (entry.targetType === 'relationship') {
      const relId = entry.changedFields?.[0]
      setHighlights({
        useCaseId: uc.id,
        fields: [],
        username: entry.username,
        relationshipId: relId ?? undefined,
      })
    }
    onClose()
  }

  const isClickable = (entry: HistoryEntry) =>
    entry.action !== 'deleted' &&
    !!entry.useCaseId &&
    useCases.some(u => u.id === entry.useCaseId)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-slate-800">História zmien</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Načítavam...
            </div>
          )}

          {error && <p className="text-xs text-red-500 px-4 py-3">{error}</p>}

          {!loading && !error && entries.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-12">Žiadne zmeny</p>
          )}

          {!loading && !error && entries.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {entries.map(entry => {
                const clickable = isClickable(entry)
                return (
                  <li
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${clickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  >
                    <ActionIcon action={entry.action} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 leading-snug">
                        <span className="font-semibold">{entry.username}</span>
                        {' '}
                        {ACTION_LABEL[entry.action] ?? entry.action}
                        {' '}
                        {TARGET_LABEL[entry.targetType] ?? entry.targetType}
                        {entry.targetName && (
                          <span className="text-slate-500"> „{entry.targetName}"</span>
                        )}
                      </p>
                      {entry.targetType !== 'relationship' && entry.changedFields?.length ? (
                        <p className="text-2xs text-amber-600 mt-0.5">
                          {[...new Set(entry.changedFields.map(fieldLabel))].join(', ')}
                        </p>
                      ) : null}
                      <p className="text-2xs text-slate-400 font-mono mt-0.5">
                        {formatRelativeTime(entry.timestamp)}
                        {clickable && <span className="ml-1 text-teal-500">↗</span>}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

const FIELD_LABEL: Record<string, string> = {
  name: 'Názov',
  primary_actor: 'Primárny aktér',
  supporting_actors: 'Podporní aktéri',
  goal: 'Cieľ',
  preconditions: 'Predpodmienky',
  postconditions: 'Postpodmienky',
}

const EXTRAS_LABEL: Record<string, string> = {
  scope: 'Rozsah',
  level: 'Úroveň',
  trigger: 'Spúšťač',
  stakeholders: 'Zainteresované strany',
  minimalGuarantees: 'Min. záruky',
  successGuarantees: 'Záruky úspechu',
  description: 'Popis',
  specialRequirements: 'Špeciálne požiadavky',
  technologyVariations: 'Tech. variácie',
}

function fieldLabel(f: string): string {
  if (f.startsWith('main_flow.')) return 'Hlavný tok'
  if (f.startsWith('alternative_flows.')) return 'Alternatívny tok'
  if (f.startsWith('template_extras.')) {
    const sub = f.slice('template_extras.'.length)
    return EXTRAS_LABEL[sub] ?? sub
  }
  return FIELD_LABEL[f] ?? f
}
