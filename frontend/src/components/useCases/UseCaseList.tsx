import { useState } from 'react'
import { useUseCases } from '../../context/UseCaseContext'
import { useProject } from '../../context/ProjectContext'
import { UseCaseItem } from './UseCaseItem'
import { Button } from '../common/Button'

export function UseCaseList() {
  const { useCases, createUseCase, loading } = useUseCases()
  const { activeProject, setActiveProject } = useProject()
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!activeProject) return
    try {
      setCreating(true)
      const uc = await createUseCase(activeProject.id, {
        name: 'Nový prípad použitia',
        templateType: 'cockburn',
        primaryActor: '',
        goal: '',
        preconditions: [],
        postconditions: [],
        mainFlow: [],
        alternativeFlows: [],
        templateExtras: {},
      })
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <div className="px-3 py-2 border-b border-slate-800">
        <button
          onClick={() => setActiveProject(null)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Projekty
        </button>
        <p className="text-sm font-semibold text-white mt-1 truncate px-0.5">
          {activeProject?.name}
        </p>
      </div>

      {/* Use case list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="section-header text-slate-500">Prípady použitia</span>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800"
            title="Pridať prípad použitia"
          >
            {creating
              ? <div className="w-3.5 h-3.5 border border-teal-400 border-t-transparent rounded-full animate-spin" />
              : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )
            }
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : useCases.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-slate-500 mb-3">Žiadne prípady použitia</p>
            <button
              onClick={handleCreate}
              className="text-xs text-teal-400 hover:text-teal-300 underline"
            >
              Pridať prvý
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {useCases.map(uc => (
              <UseCaseItem key={uc.id} useCase={uc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
