import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useProject } from './context/ProjectContext'
import { ProjectProvider } from './context/ProjectContext'
import { UseCaseProvider } from './context/UseCaseContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { AppShell } from './components/layout/AppShell'
import { AuthPage } from './components/auth/AuthPage'
import { saveShareToken } from './api/auth'

function AppInner() {
  const { activeProject, projects, setActiveProject } = useProject()
  const { user } = useAuth()

  // Auto-select the project from the share link URL once projects are loaded
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('project')
    if (projectId && !activeProject) {
      const match = projects.find(p => p.id === projectId)
      if (match) setActiveProject(match)
    }
  }, [projects])

  return (
    <WebSocketProvider
      projectId={activeProject?.id ?? null}
      clientId={user?.username ?? undefined}
    >
      <UseCaseProvider projectId={activeProject?.id ?? null}>
        <AppShell />
      </UseCaseProvider>
    </WebSocketProvider>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  // Parse share token from URL: ?project=<id>&token=<token>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('project')
    const token = params.get('token')
    if (projectId && token) {
      saveShareToken(projectId, token)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <ProjectProvider>
      <AppInner />
    </ProjectProvider>
  )
}
