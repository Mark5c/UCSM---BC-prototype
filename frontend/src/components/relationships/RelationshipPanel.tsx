import { useState, useEffect, useCallback } from 'react'
import type { UseCase } from '../../types'
import { relationshipsApi } from '../../api/relationships'
import { useProject } from '../../context/ProjectContext'
import { useUseCases } from '../../context/UseCaseContext'
import { RelationshipItem } from './RelationshipItem'
import { RelationshipForm } from './RelationshipForm'
import type { Relationship, RelationshipType } from '../../types'

interface RelationshipPanelProps {
  useCases: UseCase[]
  currentUcId: string
  onRelationshipsChange?: (rels: Relationship[]) => void
}

export function RelationshipPanel({ useCases, currentUcId, onRelationshipsChange }: RelationshipPanelProps) {
  const { activeProject } = useProject()
  const { setActiveUseCase, highlights, setHighlights } = useUseCases()
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const updateRelationships = useCallback((rels: Relationship[]) => {
    setRelationships(rels)
    onRelationshipsChange?.(rels)
  }, [onRelationshipsChange])

  const load = useCallback(async () => {
    if (!activeProject) return
    try {
      setLoading(true)
      const data = await relationshipsApi.list(activeProject.id)
      updateRelationships(data)
    } finally {
      setLoading(false)
    }
  }, [activeProject, updateRelationships])

  useEffect(() => { load() }, [load])

  const handleAdd = async (sourceId: string, targetId: string, type: RelationshipType, note?: string) => {
    if (!activeProject) return
    const rel = await relationshipsApi.create(activeProject.id, sourceId, targetId, type, note)
    updateRelationships([...relationships, rel])
    setShowForm(false)
  }

  const handleDelete = async (relId: string) => {
    if (!activeProject) return
    await relationshipsApi.delete(activeProject.id, relId)
    updateRelationships(relationships.filter(r => r.id !== relId))
  }

  const handleNavigate = (ucId: string) => {
    const uc = useCases.find(u => u.id === ucId)
    if (uc) {
      setHighlights(null)
      setActiveUseCase(uc)
    }
  }

  // Show rels involving current UC
  const relevant = relationships.filter(
    r => r.sourceId === currentUcId || r.targetId === currentUcId,
  )

  const highlightedRelId = highlights?.useCaseId === currentUcId ? highlights?.relationshipId : undefined

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="field-label mb-0">
          Vzťahy
          {relevant.length > 0 && (
            <span className="ml-1.5 text-xs font-mono text-slate-400">({relevant.length})</span>
          )}
        </span>
        <button
          onClick={() => setShowForm(f => !f)}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          {showForm ? 'Zrušiť' : '+ Pridať'}
        </button>
      </div>

      {showForm && (
        <RelationshipForm
          useCases={useCases}
          currentUcId={currentUcId}
          onAdd={handleAdd}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : relevant.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          Žiadne vzťahy pre tento prípad použitia.
        </p>
      ) : (
        <div className="space-y-1.5">
          {relevant.map(rel => (
            <RelationshipItem
              key={rel.id}
              rel={rel}
              useCases={useCases}
              onDelete={() => handleDelete(rel.id)}
              onNavigate={handleNavigate}
              highlighted={highlightedRelId === rel.id}
              highlightUsername={highlightedRelId === rel.id ? highlights?.username : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
