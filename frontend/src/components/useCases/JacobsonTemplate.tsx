import type { JacobsonExtras } from '../../types'
import { TagInput } from '../common/TagInput'

interface JacobsonTemplateProps {
  extras: JacobsonExtras
  onChange: (extras: JacobsonExtras) => void
  hl?: (field: string) => boolean
  highlightUsername?: string
}

function HlBadge({ username }: { username: string }) {
  return (
    <span className="ml-2 text-2xs bg-violet-100 text-violet-700 border border-violet-300 rounded px-1.5 py-0.5 font-medium">
      ✏ {username}
    </span>
  )
}

export function JacobsonTemplate({ extras, onChange, hl, highlightUsername }: JacobsonTemplateProps) {
  const update = (partial: Partial<JacobsonExtras>) => onChange({ ...extras, ...partial })

  return (
    <div className="border-l-4 border-violet-400 pl-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded">
          Jacobson — rozšírené polia
        </span>
      </div>

      {/* Description */}
      <div className={hl?.('description') ? 'rounded-lg bg-violet-50 border border-violet-200 p-3 -mx-3' : ''}>
        <label className="field-label flex items-center">
          Popis
          {hl?.('description') && highlightUsername && <HlBadge username={highlightUsername} />}
        </label>
        <textarea
          value={extras.description ?? ''}
          onChange={e => update({ description: e.target.value })}
          rows={3}
          className="field-input resize-none"
          placeholder="Krátky popis prípadu použitia..."
        />
      </div>

      {/* Special requirements */}
      <div className={hl?.('specialRequirements') ? 'rounded-lg bg-violet-50 border border-violet-200 p-3 -mx-3' : ''}>
        {hl?.('specialRequirements') && highlightUsername && <div className="flex justify-end mb-1"><HlBadge username={highlightUsername} /></div>}
        <TagInput
          label="Špeciálne požiadavky"
          value={extras.specialRequirements ?? []}
          onChange={val => update({ specialRequirements: val })}
          placeholder="Pridať špeciálnu požiadavku..."
        />
      </div>

      {/* Technology variations */}
      <div className={hl?.('technologyVariations') ? 'rounded-lg bg-violet-50 border border-violet-200 p-3 -mx-3' : ''}>
        {hl?.('technologyVariations') && highlightUsername && <div className="flex justify-end mb-1"><HlBadge username={highlightUsername} /></div>}
        <TagInput
          label="Technologické variácie"
          value={extras.technologyVariations ?? []}
          onChange={val => update({ technologyVariations: val })}
          placeholder="Pridať technologickú variáciu..."
        />
      </div>
    </div>
  )
}
