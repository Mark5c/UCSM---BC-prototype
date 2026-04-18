import { useProject } from '../../context/ProjectContext'
import { UseCaseList } from '../useCases/UseCaseList'

// Minimal sidebar version - shows either project nav or UC list
function SidebarProjectNav() {
  const { projects, activeProject, setActiveProject } = useProject()

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xs font-bold">UC</span>
          </div>
          <span className="text-sm font-semibold text-white">UCMS</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2">
        <p className="section-header text-slate-500 px-1 mb-2">Projekty</p>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProject(p)}
            className={`sidebar-item w-full text-left ${activeProject?.id === p.id ? 'sidebar-item-active' : ''}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { activeProject } = useProject()

  return (
    <aside className="w-56 bg-navy-900 flex flex-col flex-shrink-0 border-r border-slate-800 overflow-hidden">
      {activeProject ? <UseCaseList /> : <SidebarProjectNav />}
    </aside>
  )
}
