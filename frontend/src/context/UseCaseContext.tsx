import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { UseCase, UseCaseGroup, UseCaseHighlight } from '../types'
import { useCasesApi, useCaseFromRaw, altFlowFromRaw } from '../api/useCases'
import { groupsApi } from '../api/groups'
import { useWebSocket } from './WebSocketContext'

interface UseCaseContextValue {
  useCases: UseCase[]
  activeUseCase: UseCase | null
  setActiveUseCase: (uc: UseCase | null) => void
  createUseCase: (projectId: string, partial: Partial<UseCase>) => Promise<UseCase>
  updateUseCase: (projectId: string, uc: UseCase) => Promise<UseCase>
  deleteUseCase: (projectId: string, id: string) => Promise<void>
  loadUseCases: (projectId: string) => Promise<void>
  loading: boolean
  highlights: UseCaseHighlight | null
  setHighlights: (h: UseCaseHighlight | null) => void
  // Groups
  groups: UseCaseGroup[]
  loadGroups: (projectId: string) => Promise<void>
  createGroup: (projectId: string, name: string) => Promise<UseCaseGroup>
  renameGroup: (projectId: string, groupId: string, name: string) => Promise<void>
  deleteGroup: (projectId: string, groupId: string) => Promise<void>
  moveUseCase: (projectId: string, ucId: string, groupId: string | null) => Promise<void>
}

const UseCaseContext = createContext<UseCaseContextValue>({} as UseCaseContextValue)

export function UseCaseProvider({
  children,
  projectId,
}: {
  children: React.ReactNode
  projectId: string | null
}) {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [activeUseCase, setActiveUseCase] = useState<UseCase | null>(null)
  const [loading, setLoading] = useState(false)
  const [highlights, setHighlights] = useState<UseCaseHighlight | null>(null)
  const [groups, setGroups] = useState<UseCaseGroup[]>([])
  const { lastEvent, clientId } = useWebSocket()

  const loadUseCases = useCallback(async (pid: string) => {
    try {
      setLoading(true)
      const data = await useCasesApi.list(pid)
      setUseCases(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadGroups = useCallback(async (pid: string) => {
    const data = await groupsApi.list(pid)
    setGroups(data)
  }, [])

  useEffect(() => {
    if (projectId) {
      setActiveUseCase(null)
      loadUseCases(projectId)
      loadGroups(projectId)
    } else {
      setUseCases([])
      setActiveUseCase(null)
      setGroups([])
    }
  }, [projectId, loadUseCases, loadGroups])

  // Apply remote WebSocket events
  useEffect(() => {
    if (!lastEvent) return

    if (lastEvent.type === 'use_case_updated') {
      const incomingId = (lastEvent.payload as any).id
      setHighlights(prev => prev?.useCaseId === incomingId ? null : prev)
      const incoming = lastEvent.payload as ReturnType<typeof useCaseFromRaw>
      const uc: UseCase = {
        id: (incoming as any).id,
        projectId: (incoming as any).project_id ?? (incoming as any).projectId,
        name: (incoming as any).name,
        templateType: (incoming as any).template_type ?? (incoming as any).templateType,
        primaryActor: (incoming as any).primary_actor ?? (incoming as any).primaryActor,
        supportingActors: (incoming as any).supporting_actors ?? (incoming as any).supportingActors ?? [],
        goal: (incoming as any).goal,
        preconditions: (incoming as any).preconditions ?? [],
        postconditions: (incoming as any).postconditions ?? [],
        mainFlow: (incoming as any).main_flow ?? (incoming as any).mainFlow ?? [],
        alternativeFlows: ((incoming as any).alternative_flows ?? (incoming as any).alternativeFlows ?? []).map(altFlowFromRaw),
        templateExtras: (incoming as any).template_extras ?? (incoming as any).templateExtras ?? {},
        version: (incoming as any).version,
        updatedAt: (incoming as any).updated_at ?? (incoming as any).updatedAt,
        updatedBy: (incoming as any).updated_by ?? (incoming as any).updatedBy,
        groupId: (incoming as any).group_id ?? (incoming as any).groupId ?? null,
      }
      setUseCases(prev =>
        prev.map(existing =>
          existing.id === uc.id && uc.version >= existing.version ? uc : existing,
        ),
      )
      setActiveUseCase(prev =>
        prev?.id === uc.id && uc.version >= (prev?.version ?? 0) ? uc : prev,
      )
    }

    if (lastEvent.type === 'use_case_created') {
      const raw = lastEvent.payload as any
      const uc: UseCase = {
        id: raw.id,
        projectId: raw.project_id ?? raw.projectId,
        name: raw.name,
        templateType: raw.template_type ?? raw.templateType,
        primaryActor: raw.primary_actor ?? raw.primaryActor ?? '',
        supportingActors: raw.supporting_actors ?? raw.supportingActors ?? [],
        goal: raw.goal ?? '',
        preconditions: raw.preconditions ?? [],
        postconditions: raw.postconditions ?? [],
        mainFlow: raw.main_flow ?? raw.mainFlow ?? [],
        alternativeFlows: (raw.alternative_flows ?? raw.alternativeFlows ?? []).map(altFlowFromRaw),
        templateExtras: raw.template_extras ?? raw.templateExtras ?? {},
        version: raw.version,
        updatedAt: raw.updated_at ?? raw.updatedAt,
        updatedBy: raw.updated_by ?? raw.updatedBy,
        groupId: raw.group_id ?? raw.groupId ?? null,
      }
      setUseCases(prev => {
        if (prev.some(e => e.id === uc.id)) return prev
        return [...prev, uc]
      })
    }

    if (lastEvent.type === 'use_case_deleted') {
      const { id } = lastEvent.payload as { id: string }
      setUseCases(prev => prev.filter(uc => uc.id !== id))
      setActiveUseCase(prev => (prev?.id === id ? null : prev))
    }

    if (lastEvent.type === 'use_case_moved') {
      const { id, group_id } = lastEvent.payload as { id: string; group_id: string | null }
      setUseCases(prev => prev.map(uc => uc.id === id ? { ...uc, groupId: group_id } : uc))
    }

    if (lastEvent.type === 'group_created') {
      const raw = lastEvent.payload as any
      const g: UseCaseGroup = { id: raw.id, projectId: raw.project_id, name: raw.name, position: raw.position }
      setGroups(prev => prev.some(e => e.id === g.id) ? prev : [...prev, g].sort((a, b) => a.position - b.position))
    }

    if (lastEvent.type === 'group_updated') {
      const raw = lastEvent.payload as any
      const g: UseCaseGroup = { id: raw.id, projectId: raw.project_id, name: raw.name, position: raw.position }
      setGroups(prev => prev.map(e => e.id === g.id ? g : e))
    }

    if (lastEvent.type === 'group_deleted') {
      const { id } = lastEvent.payload as { id: string }
      setGroups(prev => prev.filter(g => g.id !== id))
      setUseCases(prev => prev.map(uc => uc.groupId === id ? { ...uc, groupId: null } : uc))
    }
  }, [lastEvent])

  const createUseCase = useCallback(async (pid: string, partial: Partial<UseCase>) => {
    const uc = await useCasesApi.create(pid, { ...partial, updatedBy: clientId })
    setUseCases(prev => prev.some(e => e.id === uc.id) ? prev : [...prev, uc])
    return uc
  }, [clientId])

  const updateUseCase = useCallback(async (pid: string, uc: UseCase) => {
    const updated = await useCasesApi.update(pid, { ...uc, updatedBy: clientId })
    setUseCases(prev => prev.map(e => e.id === updated.id ? updated : e))
    setActiveUseCase(prev => prev?.id === updated.id ? updated : prev)
    return updated
  }, [clientId])

  const deleteUseCase = useCallback(async (pid: string, id: string) => {
    await useCasesApi.delete(pid, id)
    setUseCases(prev => prev.filter(uc => uc.id !== id))
    setActiveUseCase(prev => (prev?.id === id ? null : prev))
  }, [])

  const createGroup = useCallback(async (pid: string, name: string) => {
    const maxPos = groups.reduce((m, g) => Math.max(m, g.position), -1)
    const g = await groupsApi.create(pid, name, maxPos + 1)
    setGroups(prev => prev.some(e => e.id === g.id) ? prev : [...prev, g])
    return g
  }, [groups])

  const renameGroup = useCallback(async (pid: string, groupId: string, name: string) => {
    const existing = groups.find(g => g.id === groupId)
    if (!existing) return
    const updated = await groupsApi.update(pid, groupId, name, existing.position)
    setGroups(prev => prev.map(g => g.id === groupId ? updated : g))
  }, [groups])

  const deleteGroup = useCallback(async (pid: string, groupId: string) => {
    await groupsApi.delete(pid, groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setUseCases(prev => prev.map(uc => uc.groupId === groupId ? { ...uc, groupId: null } : uc))
  }, [])

  const moveUseCase = useCallback(async (pid: string, ucId: string, groupId: string | null) => {
    await groupsApi.moveUseCase(pid, ucId, groupId)
    setUseCases(prev => prev.map(uc => uc.id === ucId ? { ...uc, groupId } : uc))
  }, [])

  return (
    <UseCaseContext.Provider value={{
      useCases, activeUseCase, setActiveUseCase,
      createUseCase, updateUseCase, deleteUseCase, loadUseCases, loading,
      highlights, setHighlights,
      groups, loadGroups, createGroup, renameGroup, deleteGroup, moveUseCase,
    }}>
      {children}
    </UseCaseContext.Provider>
  )
}

export function useUseCases() {
  return useContext(UseCaseContext)
}
