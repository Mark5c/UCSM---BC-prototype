import type { CockburnExtras } from '../../types'
import { TagInput } from '../common/TagInput'
import { LEVEL_LABELS } from '../../utils/format'

interface CockburnTemplateProps {
  extras: CockburnExtras
  onChange: (extras: CockburnExtras) => void
  hl?: (field: string) => boolean
  highlightUsername?: string
}

function HlBadge({ username }: { username: string }) {
  return (
    <span className="ml-2 text-2xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 font-medium">
      ✏ {username}
    </span>
  )
}

export function CockburnTemplate({ extras, onChange, hl, highlightUsername }: CockburnTemplateProps) {
  const update = (partial: Partial<CockburnExtras>) => onChange({ ...extras, ...partial })

  return (
    <div className="border-l-4 border-teal-500 pl-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-700 rounded">
          Cockburn — rozšírené polia
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Scope */}
        <div className={hl?.('scope') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
          <label className="field-label flex items-center">
            Rozsah systému
            {hl?.('scope') && highlightUsername && <HlBadge username={highlightUsername} />}
          </label>
          <input
            value={extras.scope ?? ''}
            onChange={e => update({ scope: e.target.value })}
            className="field-input"
            placeholder="Napr. Subsystém objednávok"
          />
        </div>

        {/* Level */}
        <div className={hl?.('level') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
          <label className="field-label flex items-center">
            Úroveň
            {hl?.('level') && highlightUsername && <HlBadge username={highlightUsername} />}
          </label>
          <select
            value={extras.level ?? ''}
            onChange={e => update({ level: e.target.value as CockburnExtras['level'] || undefined })}
            className="field-input"
          >
            <option value="">— Vybrať —</option>
            {Object.entries(LEVEL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trigger */}
      <div className={hl?.('trigger') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
        <label className="field-label flex items-center">
          Spúšťač
          {hl?.('trigger') && highlightUsername && <HlBadge username={highlightUsername} />}
        </label>
        <input
          value={extras.trigger ?? ''}
          onChange={e => update({ trigger: e.target.value })}
          className="field-input"
          placeholder="Čo spúšťa tento prípad použitia?"
        />
      </div>

      {/* Stakeholders */}
      <div className={hl?.('stakeholders') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
        {hl?.('stakeholders') && highlightUsername && <div className="flex justify-end mb-1"><HlBadge username={highlightUsername} /></div>}
        <TagInput
          label="Zainteresované strany"
          value={extras.stakeholders ?? []}
          onChange={val => update({ stakeholders: val })}
          placeholder="Pridať zainteresovanú stranu..."
        />
      </div>

      {/* Minimal guarantees */}
      <div className={hl?.('minimalGuarantees') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
        {hl?.('minimalGuarantees') && highlightUsername && <div className="flex justify-end mb-1"><HlBadge username={highlightUsername} /></div>}
        <TagInput
          label="Minimálne záruky"
          value={extras.minimalGuarantees ?? []}
          onChange={val => update({ minimalGuarantees: val })}
          placeholder="Pridať minimálnu záruku..."
        />
      </div>

      {/* Success guarantees */}
      <div className={hl?.('successGuarantees') ? 'rounded-lg bg-amber-50 border border-amber-200 p-3 -mx-3' : ''}>
        {hl?.('successGuarantees') && highlightUsername && <div className="flex justify-end mb-1"><HlBadge username={highlightUsername} /></div>}
        <TagInput
          label="Záruky úspechu"
          value={extras.successGuarantees ?? []}
          onChange={val => update({ successGuarantees: val })}
          placeholder="Pridať záruku úspechu..."
        />
      </div>
    </div>
  )
}
