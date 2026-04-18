import { useState, useRef } from 'react'
import type { UseCase, UseCaseGroup } from '../../types'
import { useUseCases } from '../../context/UseCaseContext'
import { useProject } from '../../context/ProjectContext'
import { UseCaseBoardCard } from './UseCaseBoardCard'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface Props {
  group: UseCaseGroup
  useCases: UseCase[]
  deletable?: boolean
}

type DeleteAction = 'unassign' | 'transfer' | 'delete'

export function UseCaseBoardGroup({ group, useCases, deletable = true }: Props) {
  const { activeProject } = useProject()
  const { createUseCase, deleteUseCase, renameGroup, deleteGroup, moveUseCase, groups } = useUseCases()
  const [dragOver, setDragOver] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(group.name)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false)
  const [deleteAction, setDeleteAction] = useState<DeleteAction>('unassign')
  const [transferTargetId, setTransferTargetId] = useState('')
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [confirmDeleteUc, setConfirmDeleteUc] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const otherGroups = groups.filter(g => g.id !== group.id)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const ucId = e.dataTransfer.getData('ucId')
    const pid = e.dataTransfer.getData('projectId')
    if (!ucId || !pid) return
    const alreadyHere = useCases.some(uc => uc.id === ucId)
    if (alreadyHere) return
    await moveUseCase(pid, ucId, group.id)
  }

  const commitRename = async () => {
    setEditing(false)
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === group.name || !activeProject) return
    await renameGroup(activeProject.id, group.id, trimmed)
  }

  const handleAddUseCase = async () => {
    if (!activeProject) return
    await createUseCase(activeProject.id, {
      name: 'Nový prípad použitia',
      templateType: 'cockburn',
      groupId: group.id,
    })
  }

  const handleDeleteGroup = async () => {
    if (!activeProject) return
    try {
      setDeletingGroup(true)
      if (deleteAction === 'delete') {
        for (const uc of useCases) {
          await deleteUseCase(activeProject.id, uc.id)
        }
      } else if (deleteAction === 'transfer' && transferTargetId) {
        for (const uc of useCases) {
          await moveUseCase(activeProject.id, uc.id, transferTargetId)
        }
      }
      // 'unassign': backend ON DELETE SET NULL handles it automatically
      await deleteGroup(activeProject.id, group.id)
    } finally {
      setDeletingGroup(false)
      setConfirmDeleteGroup(false)
    }
  }

  const handleDeleteUc = async (ucId: string) => {
    if (!activeProject) return
    await deleteUseCase(activeProject.id, ucId)
  }

  return (
    <>
      <div
        className={`flex flex-col w-64 flex-shrink-0 rounded-xl border-2 transition-colors
          ${dragOver ? 'border-teal-400 bg-teal-50/40' : 'border-slate-200 bg-slate-50/60'}`}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          {editing ? (
            <input
              ref={nameRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setEditing(false); setNameInput(group.name) } }}
              className="flex-1 text-sm font-semibold text-slate-800 bg-white border border-teal-400 rounded px-1.5 py-0.5 outline-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setEditing(true); setNameInput(group.name) }}
              className="flex-1 text-left text-sm font-semibold text-slate-800 hover:text-teal-700 truncate"
              title="Kliknite pre premenovanie"
            >
              {group.name}
            </button>
          )}
          <span className="text-xs text-slate-400 font-mono flex-shrink-0">{useCases.length}</span>
          {deletable && (
            <button
              onClick={() => setConfirmDeleteGroup(true)}
              className="p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 flex-shrink-0 transition-colors"
              title="Odstrániť skupinu"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Cards */}
        <div className="flex-1 px-2 pb-2 space-y-1.5 min-h-[48px]">
          {useCases.map(uc => (
            <UseCaseBoardCard
              key={uc.id}
              uc={uc}
              onDelete={() => setConfirmDeleteUc(uc.id)}
            />
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={handleAddUseCase}
          className="mx-2 mb-2 flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg border border-dashed border-slate-200 hover:border-teal-300 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Pridať prípad použitia
        </button>
      </div>

      {/* Custom group delete dialog */}
      {confirmDeleteGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Odstrániť skupinu „{group.name}"</h3>
              {useCases.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Skupina obsahuje {useCases.length} {useCases.length === 1 ? 'prípad použitia' : useCases.length < 5 ? 'prípady použitia' : 'prípadov použitia'}. Čo sa má s nimi stať?
                </p>
              )}
            </div>

            {useCases.length > 0 && (
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="deleteAction" value="unassign" checked={deleteAction === 'unassign'} onChange={() => setDeleteAction('unassign')} className="mt-0.5 accent-teal-600" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">Presunúť do Nepriradené</p>
                    <p className="text-2xs text-slate-400">Prípady použitia zostanú v projekte bez skupiny.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="deleteAction" value="transfer" checked={deleteAction === 'transfer'} onChange={() => { setDeleteAction('transfer'); if (!transferTargetId && otherGroups.length) setTransferTargetId(otherGroups[0].id) }} className="mt-0.5 accent-teal-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">Presunúť do inej skupiny</p>
                    {deleteAction === 'transfer' && (
                      <select
                        value={transferTargetId}
                        onChange={e => setTransferTargetId(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-teal-400"
                      >
                        {otherGroups.length === 0
                          ? <option value="">— Žiadne iné skupiny —</option>
                          : otherGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                        }
                      </select>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="deleteAction" value="delete" checked={deleteAction === 'delete'} onChange={() => setDeleteAction('delete')} className="mt-0.5 accent-red-500" />
                  <div>
                    <p className="text-xs font-medium text-red-600">Odstrániť všetky prípady použitia</p>
                    <p className="text-2xs text-slate-400">Táto akcia je nezvratná.</p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDeleteGroup}
                disabled={deletingGroup || (deleteAction === 'transfer' && !transferTargetId)}
                className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {deletingGroup && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {deletingGroup ? 'Odstraňujem…' : 'Odstrániť skupinu'}
              </button>
              <button
                onClick={() => setConfirmDeleteGroup(false)}
                disabled={deletingGroup}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteUc}
        onClose={() => setConfirmDeleteUc(null)}
        onConfirm={() => { if (confirmDeleteUc) handleDeleteUc(confirmDeleteUc); setConfirmDeleteUc(null) }}
        title="Odstrániť prípad použitia"
        message="Naozaj chcete odstrániť tento prípad použitia?"
        confirmLabel="Odstrániť"
      />
    </>
  )
}
