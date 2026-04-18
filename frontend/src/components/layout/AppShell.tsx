import { useProject } from '../../context/ProjectContext'
import { useUseCases } from '../../context/UseCaseContext'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ProjectList } from '../projects/ProjectList'
import { UseCaseEditor } from '../useCases/UseCaseEditor'
import { UseCaseBoard } from '../board/UseCaseBoard'

function MainArea() {
  const { activeProject } = useProject()
  const { activeUseCase } = useUseCases()

  if (!activeProject) return <ProjectList />
  if (!activeUseCase) return <UseCaseBoard />
  return <UseCaseEditor />
}

export function AppShell() {
  const { activeProject } = useProject()

  return (
    <div className="flex h-full bg-[#f8fafc]">
      {/* Sidebar — only visible when in a project */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <MainArea />
        </main>
      </div>
    </div>
  )
}
