import { useState } from 'react'
import type { UseCase } from '../../types'
import { useUseCases } from '../../context/UseCaseContext'
import { useProject } from '../../context/ProjectContext'
import { ConfirmDialog } from '../common/ConfirmDialog'


interface UseCaseItemProps {
  useCase: UseCase
}

export function UseCaseItem({ useCase }: UseCaseItemProps) {
  const { activeUseCase, setActiveUseCase, deleteUseCase } = useUseCases()
  const { activeProject } = useProject()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isActive = activeUseCase?.id === useCase.id

  const handleDelete = async () => {
    if (!activeProject) return
    try {
      setDeleting(true)
      await deleteUseCase(activeProject.id, useCase.id)
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const isCockburn = useCase.templateType === 'cockburn'
  const templateBg = isActive
    ? (isCockburn ? 'bg-teal-900/40' : 'bg-violet-900/40')
    : (isCockburn ? 'bg-teal-900/20 hover:bg-teal-900/30' : 'bg-violet-900/20 hover:bg-violet-900/30')
  const templateBorder = isCockburn ? 'border-teal-500' : 'border-violet-500'
  const templateText = isCockburn ? 'text-teal-300' : 'text-violet-300'

  return (
    <>
      <div
        className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer border-l-2 ${templateBorder} ${templateBg}`}
        onClick={() => setActiveUseCase(useCase)}
      >
        <div className="flex-1 min-w-0">
          <p className={`text-xs truncate font-medium ${templateText}`}>
            {useCase.name || <span className="italic text-slate-500">Bez názvu</span>}
          </p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setDeleteOpen(true) }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/20 flex-shrink-0"
          title="Odstrániť"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Odstrániť prípad použitia"
        message={`Naozaj chcete odstrániť „${useCase.name}"?`}
        confirmLabel="Odstrániť"
      />
    </>
  )
}
