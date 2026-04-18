import { useState } from 'react'
import { ConnectionBadge } from './ConnectionBadge'
import { useProject } from '../../context/ProjectContext'
import { useUseCases } from '../../context/UseCaseContext'
import { formatRelativeTime } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'
import { HistoryPanel } from '../history/HistoryPanel'

export function TopBar() {
  const { activeProject } = useProject()
  const { activeUseCase, setActiveUseCase } = useUseCases()
  const { user, logout } = useAuth()
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <>
    <header className="h-12 flex items-center justify-between px-5 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Back button — only when a UC is open */}
        {activeUseCase ? (
          <>
            <button
              onClick={() => setActiveUseCase(null)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-medium transition-colors flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Späť
            </button>
            <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-medium text-slate-500 truncate">{activeProject?.name}</span>
            <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-medium text-slate-800 truncate">{activeUseCase.name}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-slate-800 truncate">
            {activeProject?.name ?? 'UCMS'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {activeUseCase && (
          <span className="hidden sm:block text-xs text-slate-400">
            Zmenil: <span className="font-medium text-slate-500 font-mono">{activeUseCase.updatedBy}</span>
            {' · '}
            {formatRelativeTime(activeUseCase.updatedAt)}
          </span>
        )}

        {activeProject && (
          <button
            onClick={() => setHistoryOpen(true)}
            title="História zmien"
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
          <span className="font-medium">{user?.username}</span>
          <button
            onClick={logout}
            title="Odhlásiť sa"
            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {activeProject && <ConnectionBadge />}
      </div>
    </header>

    {activeProject && (
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        projectId={activeProject.id}
      />
    )}
  </>
  )
}
