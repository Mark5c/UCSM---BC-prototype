import client from './client'
import type { UseCaseGroup } from '../types'

interface GroupRaw {
  id: string
  project_id: string
  name: string
  position: number
}

function fromRaw(r: GroupRaw): UseCaseGroup {
  return { id: r.id, projectId: r.project_id, name: r.name, position: r.position }
}

export const groupsApi = {
  list: async (projectId: string): Promise<UseCaseGroup[]> => {
    const { data } = await client.get<GroupRaw[]>(`/projects/${projectId}/groups`)
    return data.map(fromRaw)
  },

  create: async (projectId: string, name: string, position = 0): Promise<UseCaseGroup> => {
    const { data } = await client.post<GroupRaw>(`/projects/${projectId}/groups`, { name, position })
    return fromRaw(data)
  },

  update: async (projectId: string, groupId: string, name: string, position: number): Promise<UseCaseGroup> => {
    const { data } = await client.put<GroupRaw>(`/projects/${projectId}/groups/${groupId}`, { name, position })
    return fromRaw(data)
  },

  delete: async (projectId: string, groupId: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/groups/${groupId}`)
  },

  moveUseCase: async (projectId: string, ucId: string, groupId: string | null): Promise<void> => {
    await client.patch(`/projects/${projectId}/use-cases/${ucId}/group`, { group_id: groupId })
  },
}
