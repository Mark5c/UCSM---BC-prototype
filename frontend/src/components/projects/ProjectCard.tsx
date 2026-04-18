import { useState } from 'react'
import type { Project } from '../../types'
import { useProject } from '../../context/ProjectContext'
import { ProjectForm } from './ProjectForm'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { formatRelativeTime } from '../../utils/format'

interface ProjectCardProps {
  project: Project
}

const VISIBILITY_LABELS: Record<string, string> = { private: 'Súkromný', link: 'Odkaz', public: 'Verejný' }
const VISIBILITY_COLORS: Record<string, string> = { private: 'bg-slate-300', link: 'bg-amber-400', public: 'bg-green-400' }

export function ProjectCard({ project }: ProjectCardProps) {
  const { setActiveProject, deleteProject } = useProject()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/?project=${project.id}&token=${project.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await deleteProject(project.id)
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="card p-4 hover:border-teal-300 hover:shadow-md cursor-pointer group transition-all duration-150"
        onClick={() => setActiveProject(project)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal-700">
                {project.name}
              </h3>
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 line-clamp-2 ml-4">{project.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 ml-4">
              <span className="flex items-center gap-1 text-2xs text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${VISIBILITY_COLORS[project.visibility ?? 'private']}`} />
                {VISIBILITY_LABELS[project.visibility ?? 'private']}
              </span>
              <span className="text-2xs text-slate-300 font-mono">{formatRelativeTime(project.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {project.visibility === 'link' && project.shareToken && (
              <div className="relative">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                  title="Kopírovať odkaz"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xs bg-slate-700 text-white px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                    Skopírované!
                  </span>
                )}
              </div>
            )}
            <button
              onClick={e => { e.stopPropagation(); setEditOpen(true) }}
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Upraviť"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); setDeleteOpen(true) }}
              className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
              title="Odstrániť"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ProjectForm open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Odstrániť projekt"
        message={`Naozaj chcete odstrániť projekt „${project.name}"? Táto akcia je nevratná.`}
        confirmLabel="Odstrániť"
      />
    </>
  )
}
