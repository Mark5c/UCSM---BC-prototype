import client from './client'
import type { Relationship, RelationshipRaw, RelationshipType } from '../types'

function fromRaw(r: RelationshipRaw): Relationship {
  return {
    id: r.id,
    projectId: r.project_id,
    sourceId: r.source_id,
    targetId: r.target_id,
    type: r.type,
    note: r.note,
  }
}

export const relationshipsApi = {
  list: async (projectId: string): Promise<Relationship[]> => {
    const { data } = await client.get<RelationshipRaw[]>(`/projects/${projectId}/relationships`)
    return data.map(fromRaw)
  },

  create: async (
    projectId: string,
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    note?: string,
  ): Promise<Relationship> => {
    const { data } = await client.post<RelationshipRaw>(
      `/projects/${projectId}/relationships`,
      { source_id: sourceId, target_id: targetId, type, note },
    )
    return fromRaw(data)
  },

  delete: async (projectId: string, relId: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/relationships/${relId}`)
  },
}
