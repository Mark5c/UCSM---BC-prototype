// ── Template & relationship enums ─────────────────────────────────────────────

export type TemplateType = 'cockburn' | 'jacobson'
export type RelationshipType = 'include' | 'extend'
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'
export type ValidationSeverity = 'error' | 'warning'

// ── Flow sub-models ───────────────────────────────────────────────────────────

export interface Step {
  id: string
  order: number
  text: string
}

export interface AlternativeFlow {
  id: string
  label: string           // auto-assigned positional label e.g. "A1", "A2" — not derived from step link
  name: string
  condition: string
  steps: Step[]
  triggeredByStepId?: string  // ID of the main flow step that triggers this flow
}

export interface BasicFlow {
  id: string
  name: string
  steps: Step[]
}

export interface JacobsonAlternativeFlow {
  id: string
  label: string       // auto-assigned A1, A2, A3…
  name: string
  condition: string
  steps: Step[]
  triggeredByBasicFlowId?: string   // which BasicFlow
  triggeredByStepId?: string        // which Step inside that BasicFlow
}

export interface Subflow {
  id: string
  label: string   // "S1", "S2", … — auto-assigned, not editable
  name: string
  steps: Step[]
}

// ── Template extras ───────────────────────────────────────────────────────────

export interface CockburnExtras {
  scope?: string
  level?: 'summary' | 'user-goal' | 'subfunction'
  stakeholders?: string[]
  trigger?: string
  minimalGuarantees?: string[]
  successGuarantees?: string[]
}

export interface JacobsonExtras {
  description?: string
  specialRequirements?: string[]
  technologyVariations?: string[]
  basicFlows?: BasicFlow[]
  subflows?: Subflow[]
  jacobsonAltFlows?: JacobsonAlternativeFlow[]
}

// ── Use Case ──────────────────────────────────────────────────────────────────

export interface UseCase {
  id: string
  projectId: string
  name: string
  templateType: TemplateType
  primaryActor: string
  supportingActors: string[]
  goal: string
  preconditions: string[]
  postconditions: string[]
  mainFlow: Step[]
  alternativeFlows: AlternativeFlow[]
  templateExtras: CockburnExtras & JacobsonExtras
  version: number
  updatedAt: string
  updatedBy: string
  groupId?: string | null
}

export interface UseCaseGroup {
  id: string
  projectId: string
  name: string
  position: number
}

// API shape uses snake_case; we convert in the API layer
export interface UseCaseRaw {
  id: string
  project_id: string
  name: string
  template_type: TemplateType
  primary_actor: string
  supporting_actors: string[]
  goal: string
  preconditions: string[]
  postconditions: string[]
  main_flow: Step[]
  alternative_flows: AlternativeFlow[]
  template_extras: Record<string, unknown>
  version: number
  updated_at: string
  updated_by: string
}

// ── Project ───────────────────────────────────────────────────────────────────

export type ProjectVisibility = 'private' | 'link' | 'public'

export interface Project {
  id: string
  name: string
  description?: string
  ownerId?: string
  visibility: ProjectVisibility
  shareToken?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectRaw {
  id: string
  name: string
  description?: string
  owner_id?: string
  visibility: ProjectVisibility
  share_token?: string
  created_at: string
  updated_at: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  createdAt: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  user: User
}

// ── History ───────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string
  projectId: string
  useCaseId: string | null
  userId: string | null
  username: string
  action: 'created' | 'updated' | 'deleted'
  targetType: 'use_case' | 'relationship' | 'project'
  targetName: string | null
  timestamp: string
  changedFields?: string[] | null
}

export interface UseCaseHighlight {
  useCaseId: string
  fields: string[]
  username: string
  relationshipId?: string
}

// ── Relationship ──────────────────────────────────────────────────────────────

export interface Relationship {
  id: string
  projectId: string
  sourceId: string
  targetId: string
  type: RelationshipType
  note?: string
}

export interface RelationshipRaw {
  id: string
  project_id: string
  source_id: string
  target_id: string
  type: RelationshipType
  note?: string
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationIssue {
  field: string
  message: string
  severity: ValidationSeverity
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export interface WSEvent {
  type: string
  payload: unknown
  version: number
  updatedBy: string
  timestamp: string
}
