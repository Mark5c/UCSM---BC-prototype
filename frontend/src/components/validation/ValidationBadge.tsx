import type { ValidationIssue } from '../../types'

interface ValidationBadgeProps {
  issues: ValidationIssue[]
  field: string
}

export function ValidationBadge({ issues, field }: ValidationBadgeProps) {
  const fieldIssues = issues.filter(i => i.field === field || i.field.startsWith(field))
  if (fieldIssues.length === 0) return null

  const hasError = fieldIssues.some(i => i.severity === 'error')

  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-2xs font-bold ml-1
        ${hasError ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
      title={fieldIssues.map(i => i.message).join('\n')}
    >
      {fieldIssues.length}
    </span>
  )
}
