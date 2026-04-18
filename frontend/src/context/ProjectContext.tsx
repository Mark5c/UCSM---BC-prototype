import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Project, ProjectVisibility } from '../types'
import { projectsApi } from '../api/projects'
import { getShareTokenMap } from '../api/auth'

interface ProjectContextValue {
  projects: Project[]
  activeProject: Project | null
  setActiveProject: (p: Project | null) => void
  createProject: (name: string, description?: string, visibility?: ProjectVisibility) => Promise<Project>
  updateProject: (id: string, name: string, description?: string, visibility?: ProjectVisibility) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue>({} as ProjectContextValue)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await projectsApi.list()

      // Also load any projects the user has a share token for
      const tokenMap = getShareTokenMap()
      const sharedResults = await Promise.allSettled(
        Object.keys(tokenMap).map(id => projectsApi.get(id))
      )
      const sharedProjects = sharedResults
        .filter((r): r is PromiseFulfilledResult<Project> => r.status === 'fulfilled')
        .map(r => r.value)

      const seen = new Set(data.map(p => p.id))
      setProjects([...data, ...sharedProjects.filter(p => !seen.has(p.id))])
    } catch {
      setError('Nepodarilo sa načítať projekty')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const createProject = useCallback(async (name: string, description?: string, visibility: ProjectVisibility = 'private') => {
    const project = await projectsApi.create(name, description, visibility)
    setProjects(prev => [project, ...prev])
    return project
  }, [])

  const updateProject = useCallback(async (id: string, name: string, description?: string, visibility: ProjectVisibility = 'private') => {
    const updated = await projectsApi.update(id, name, description, visibility)
    setProjects(prev => prev.map(p => p.id === id ? updated : p))
    if (activeProject?.id === id) setActiveProject(updated)
    return updated
  }, [activeProject])

  const deleteProject = useCallback(async (id: string) => {
    await projectsApi.delete(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (activeProject?.id === id) setActiveProject(null)
  }, [activeProject])

  return (
    <ProjectContext.Provider value={{
      projects, activeProject, setActiveProject,
      createProject, updateProject, deleteProject,
      loading, error, reload,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  return useContext(ProjectContext)
}
