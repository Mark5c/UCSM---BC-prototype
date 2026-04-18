import { useState } from 'react'
import { useProject } from '../../context/ProjectContext'
import { ProjectCard } from './ProjectCard'
import { ProjectForm } from './ProjectForm'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'

export function ProjectList() {
  const { projects, loading, error } = useProject()
  const [createOpen, setCreateOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Projekty</h1>
          <p className="text-xs text-slate-400 mt-0.5">UCMS — Podpora modelovania prípadov použitia</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nový projekt
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            title="Žiadne projekty"
            description="Vytvorte prvý projekt a začnite modelovať prípady použitia."
            action={
              <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                Vytvoriť projekt
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      <ProjectForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
