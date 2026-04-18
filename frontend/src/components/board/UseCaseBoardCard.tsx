import type { UseCase } from '../../types'
import { useUseCases } from '../../context/UseCaseContext'
import { useProject } from '../../context/ProjectContext'

const TEMPLATE_STYLE: Record<string, { card: string; text: string }> = {
  cockburn: { card: 'bg-teal-50 border-teal-200 hover:border-teal-300', text: 'text-teal-700' },
  jacobson: { card: 'bg-violet-50 border-violet-200 hover:border-violet-300', text: 'text-violet-700' },
}

interface Props {
  uc: UseCase
  onDelete: () => void
}

export function UseCaseBoardCard({ uc, onDelete }: Props) {
  const { setActiveUseCase } = useUseCases()
  const { activeProject } = useProject()

  const style = TEMPLATE_STYLE[uc.templateType] ?? { card: 'bg-slate-50 border-slate-200 hover:border-slate-300', text: 'text-slate-700' }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('ucId', uc.id)
    e.dataTransfer.setData('projectId', activeProject?.id ?? '')
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => setActiveUseCase(uc)}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg border hover:shadow-sm cursor-pointer transition-all select-none ${style.card}`}
    >
      <span className={`flex-1 text-sm font-medium leading-snug min-w-0 break-words ${style.text}`}>
        {uc.name || <span className="italic opacity-50">Bez názvu</span>}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
        title="Odstrániť"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
