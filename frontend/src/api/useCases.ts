import client from './client'
import type { UseCase, UseCaseRaw } from '../types'

/** Map a raw alt flow object (snake_case from backend) → camelCase AlternativeFlow */
function altFlowFromRaw(raw: any): UseCase['alternativeFlows'][number] {
  return {
    id: raw.id,
    label: raw.label,
    name: raw.name ?? '',
    condition: raw.condition,
    steps: raw.steps ?? [],
    triggeredByStepId: raw.triggered_by_step_id ?? raw.triggeredByStepId ?? undefined,
  }
}

/** Map a camelCase AlternativeFlow → snake_case for the backend */
function altFlowToRaw(alt: UseCase['alternativeFlows'][number]) {
  return {
    id: alt.id,
    label: alt.label,
    name: alt.name ?? '',
    condition: alt.condition,
    steps: alt.steps,
    triggered_by_step_id: alt.triggeredByStepId ?? null,
  }
}

function fromRaw(r: UseCaseRaw): UseCase {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    templateType: r.template_type,
    primaryActor: r.primary_actor,
    supportingActors: r.supporting_actors ?? [],
    goal: r.goal,
    preconditions: r.preconditions,
    postconditions: r.postconditions,
    mainFlow: r.main_flow,
    alternativeFlows: (r.alternative_flows ?? []).map(altFlowFromRaw),
    templateExtras: r.template_extras as UseCase['templateExtras'],
    version: r.version,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
    groupId: (r as any).group_id ?? null,
  }
}

function toPayload(uc: Partial<UseCase> & { version?: number; updatedBy?: string }) {
  return {
    name: uc.name ?? '',
    template_type: uc.templateType ?? 'cockburn',
    primary_actor: uc.primaryActor ?? '',
    supporting_actors: uc.supportingActors ?? [],
    goal: uc.goal ?? '',
    preconditions: uc.preconditions ?? [],
    postconditions: uc.postconditions ?? [],
    main_flow: uc.mainFlow ?? [],
    alternative_flows: (uc.alternativeFlows ?? []).map(altFlowToRaw),
    template_extras: uc.templateExtras ?? {},
    updated_by: uc.updatedBy ?? 'anonymous',
    version: uc.version,
  }
}

export const useCasesApi = {
  list: async (projectId: string): Promise<UseCase[]> => {
    const { data } = await client.get<UseCaseRaw[]>(`/projects/${projectId}/use-cases`)
    return data.map(fromRaw)
  },

  create: async (projectId: string, uc: Partial<UseCase> & { updatedBy?: string }): Promise<UseCase> => {
    const { data } = await client.post<UseCaseRaw>(
      `/projects/${projectId}/use-cases`,
      { ...toPayload(uc), group_id: uc.groupId ?? null },
    )
    return fromRaw(data)
  },

  update: async (projectId: string, uc: UseCase): Promise<UseCase> => {
    const { data } = await client.put<UseCaseRaw>(
      `/projects/${projectId}/use-cases/${uc.id}`,
      toPayload(uc),
    )
    return fromRaw(data)
  },

  delete: async (projectId: string, ucId: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/use-cases/${ucId}`)
  },
}

export { fromRaw as useCaseFromRaw, altFlowFromRaw }
