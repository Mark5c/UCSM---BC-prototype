import { useState } from 'react'
import type { UseCase, RelationshipType } from '../../types'
import { Button } from '../common/Button'
import { RELATIONSHIP_LABELS } from '../../utils/format'

interface RelationshipFormProps {
  useCases: UseCase[]
  currentUcId: string
  onAdd: (sourceId: string, targetId: string, type: RelationshipType, note?: string) => Promise<void>
}

export function RelationshipForm({ useCases, currentUcId, onAdd }: RelationshipFormProps) {
  const [sourceId, setSourceId] = useState(currentUcId)
  const [targetId, setTargetId] = useState('')
  const [type, setType] = useState<RelationshipType>('include')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!targetId) { setError('Vyberte cieľový prípad použitia'); return }
    if (sourceId === targetId) { setError('Zdroj a cieľ nemôžu byť rovnaké'); return }
    try {
      setSaving(true)
      setError('')
      await onAdd(sourceId, targetId, type, note.trim() || undefined)
      setTargetId('')
      setNote('')
    } catch {
      setError('Nepodarilo sa pridať vzťah')
    } finally {
      setSaving(false)
    }
  }

  const otherUcs = useCases

  return (
    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pridať vzťah</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label">Zdroj</label>
          <select
            value={sourceId}
            onChange={e => setSourceId(e.target.value)}
            className="field-input"
          >
            {useCases.map(uc => (
              <option key={uc.id} value={uc.id}>{uc.name || '(bez názvu)'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Typ vzťahu</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as RelationshipType)}
            className="field-input font-mono"
          >
            {Object.entries(RELATIONSHIP_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Cieľ</label>
        <select
          value={targetId}
          onChange={e => { setTargetId(e.target.value); setError('') }}
          className={`field-input ${error ? 'field-input-error' : ''}`}
        >
          <option value="">— Vybrať cieľ —</option>
          {otherUcs.filter(uc => uc.id !== sourceId).map(uc => (
            <option key={uc.id} value={uc.id}>{uc.name || '(bez názvu)'}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">Poznámka</label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          className="field-input"
          placeholder="Poznámka..."
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button variant="primary" size="sm" onClick={handleAdd} loading={saving}>
        Pridať vzťah
      </Button>
    </div>
  )
}
