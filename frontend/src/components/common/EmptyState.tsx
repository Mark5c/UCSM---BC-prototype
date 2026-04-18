interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

import React from 'react'

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="mb-4 text-slate-300">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-600 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
