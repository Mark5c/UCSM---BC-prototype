export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)

    if (diffSec < 60) return 'práve teraz'
    if (diffSec < 3600) return `pred ${Math.floor(diffSec / 60)} min`
    if (diffSec < 86400) return `pred ${Math.floor(diffSec / 3600)} hod`
    return formatDate(isoString)
  } catch {
    return isoString
  }
}

export function generateClientId(): string {
  return `user-${Math.random().toString(36).slice(2, 7)}`
}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  include: '«include»',
  extend: '«extend»',
}

export const TEMPLATE_LABELS: Record<string, string> = {
  cockburn: 'Cockburn',
  jacobson: 'Jacobson',
}

export const LEVEL_LABELS: Record<string, string> = {
  summary: 'Súhrnná',
  'user-goal': 'Používateľský cieľ',
  subfunction: 'Podfunkcia',
}
