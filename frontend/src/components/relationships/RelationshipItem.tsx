import { useState } from 'react'
import type { Relationship, UseCase } from '../../types'
import { RELATIONSHIP_LABELS } from '../../utils/format'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface RelationshipItemProps {
  rel: Relationship
  useCases: UseCase[]
  onDelete: () => void
  onNavigate?: (ucId: string) => void
  highlighted?: boolean
  highlightUsername?: string
}

export function RelationshipItem({ rel, useCases, onDelete, onNavigate, highlighted, highlightUsername }: RelationshipItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const source = useCases.find(uc => uc.id === rel.sourceId)
  const target = useCases.find(uc => uc.id === rel.targetId)

  const typeColors: Record<string, string> = {
    include: 'bg-blue-50 text-blue-700 border-blue-200',
    extend:  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  }

  const UcChip = ({ uc, ucId }: { uc: UseCase | undefined; ucId: string }) => {
    const name = uc?.name ?? <span className="italic text-slate-400">Neznámy</span>
    if (!onNavigate || !uc) {
      return <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">{name}</span>
    }
    return (
      <button
        onClick={() => onNavigate(ucId)}
        className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline truncate max-w-[140px] text-left"
        title={`Otvoriť: ${uc.name}`}
      >
        {name}
      </button>
    )
  }

  return (
    <>
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border group transition-colors
        ${highlighted
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
        }`}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <UcChip uc={source} ucId={rel.sourceId} />
          <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 font-mono ${typeColors[rel.type]}`}>
            {RELATIONSHIP_LABELS[rel.type]}
          </span>
          <UcChip uc={target} ucId={rel.targetId} />
        </div>
        {rel.note && (
          <span className="text-2xs text-slate-400 italic truncate max-w-[80px] flex-shrink-0">{rel.note}</span>
        )}
        {highlighted && highlightUsername && (
          <span className="text-2xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 font-medium flex-shrink-0">
            ✏ {highlightUsername}
          </span>
        )}
        <button
          onClick={() => setConfirmOpen(true)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 flex-shrink-0"
          title="Odstrániť"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { onDelete(); setConfirmOpen(false) }}
        title="Odstrániť vzťah"
        message="Naozaj chcete odstrániť tento vzťah?"
        confirmLabel="Odstrániť"
      />
    </>
  )
}
