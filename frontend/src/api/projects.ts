import client from './client'
import type { Project, ProjectRaw, ProjectVisibility } from '../types'

function fromRaw(r: ProjectRaw): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    ownerId: r.owner_id,
    visibility: r.visibility ?? 'private',
    shareToken: r.share_token,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const projectsApi = {
  get: async (id: string): Promise<Project> => {
    const { data } = await client.get<ProjectRaw>(`/projects/${id}`)
    return fromRaw(data)
  },

  list: async (): Promise<Project[]> => {
    const { data } = await client.get<ProjectRaw[]>('/projects')
    return data.map(fromRaw)
  },

  create: async (name: string, description?: string, visibility: ProjectVisibility = 'private'): Promise<Project> => {
    const { data } = await client.post<ProjectRaw>('/projects', { name, description, visibility })
    return fromRaw(data)
  },

  update: async (id: string, name: string, description?: string, visibility: ProjectVisibility = 'private'): Promise<Project> => {
    const { data } = await client.put<ProjectRaw>(`/projects/${id}`, { name, description, visibility })
    return fromRaw(data)
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/projects/${id}`)
  },

  getHistory: async (id: string) => {
    const { data } = await client.get(`/projects/${id}/history`)
    return (data as any[]).map(r => ({
      id: r.id,
      projectId: r.project_id,
      useCaseId: r.use_case_id,
      userId: r.user_id,
      username: r.username,
      action: r.action,
      targetType: r.target_type,
      targetName: r.target_name,
      timestamp: r.timestamp,
      changedFields: r.changed_fields ?? null,
    }))
  },
}
