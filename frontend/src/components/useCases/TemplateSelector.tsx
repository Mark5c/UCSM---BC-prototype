import type { TemplateType } from '../../types'

interface TemplateSelectorProps {
  value: TemplateType
  onChange: (t: TemplateType) => void
}

const templates = [
  {
    type: 'cockburn' as TemplateType,
    label: 'Cockburn',
    description: 'Plne štruktúrovaný formát s úrovňami, zárukami a zainteresovanými stranami.',
    color: 'teal',
  },
  {
    type: 'jacobson' as TemplateType,
    label: 'Jacobson',
    description: 'OOSE-orientovaný formát so špeciálnymi požiadavkami a technologickými variáciami.',
    color: 'violet',
  },
]

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div>
      <label className="field-label">Typ šablóny</label>
      <div className="grid grid-cols-2 gap-2">
        {templates.map(t => {
          const isSelected = value === t.type
          const colorClasses = t.color === 'teal'
            ? isSelected
              ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/30'
              : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
            : isSelected
              ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-400/30'
              : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'

          const badgeClasses = t.color === 'teal'
            ? 'bg-teal-100 text-teal-700'
            : 'bg-violet-100 text-violet-700'

          return (
            <button
              key={t.type}
              type="button"
              onClick={() => onChange(t.type)}
              className={`p-3 border rounded-lg text-left transition-all ${colorClasses}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${badgeClasses}`}>
                  {t.label}
                </span>
                {isSelected && (
                  <svg className={`w-3.5 h-3.5 ${t.color === 'teal' ? 'text-teal-600' : 'text-violet-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
