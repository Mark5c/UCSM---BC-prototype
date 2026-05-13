import { useState } from 'react'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { useProject } from '../../context/ProjectContext'
import type { Project, ProjectVisibility } from '../../types'

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  project?: Project
}

const VISIBILITY_OPTIONS: { value: ProjectVisibility; label: string; desc: string }[] = [
  { value: 'private', label: 'Súkromný', desc: 'Iba ty' },
  { value: 'link', label: 'Zdieľaný odkazom', desc: 'Ktokoľvek s odkazom' },
  { value: 'public', label: 'Verejný', desc: 'Všetci prihlasení' },
]

export function ProjectForm({ open, onClose, project }: ProjectFormProps) {
  const { createProject, updateProject } = useProject()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [visibility, setVisibility] = useState<ProjectVisibility>(project?.visibility ?? 'private')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!project

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Názov projektu je povinný'); return }
    try {
      setLoading(true)
      setError('')
      if (isEdit) {
        await updateProject(project.id, name.trim(), description.trim() || undefined, visibility)
      } else {
        await createProject(name.trim(), description.trim() || undefined, visibility)
        setName('')
        setDescription('')
        setVisibility('private')
      }
      onClose()
    } catch {
      setError('Nepodarilo sa uložiť projekt')
    } finally {
      setLoading(false)
    }
  }

  const borderActive = 'border-teal-400 bg-teal-50'
  const borderInactive = 'border-slate-200 hover:border-slate-300'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Upraviť projekt' : 'Nový projekt'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Názov projektu"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="Napr. Systém správy objednávok"
          autoFocus
          error={!!error}
        />
        <div>
          <label className="field-label">Popis (voliteľné)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Krátky popis projektu..."
            rows={2}
            className="field-input resize-none"
          />
        </div>

        <div>
          <label className="field-label">Viditeľnosť</label>
          <div className="space-y-2 mt-1">
            {VISIBILITY_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${visibility === opt.value ? borderActive : borderInactive}`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => setVisibility(opt.value)}
                  className="accent-teal-600"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                  <span className="text-xs text-slate-400 ml-2">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Zrušiť</Button>
          <Button variant="primary" type="submit" loading={loading}>{isEdit ? 'Uložiť' : 'Vytvoriť'}</Button>
        </div>
      </form>
    </Modal>
  )
}
