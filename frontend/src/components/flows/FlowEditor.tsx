import { useState, useEffect } from 'react'
import type { Step, AlternativeFlow, TemplateType, BasicFlow, Subflow, JacobsonAlternativeFlow } from '../../types'
import { StepList } from './StepList'
import { AlternativeFlowList } from './AlternativeFlowList'
import { BasicFlowList } from './BasicFlowList'
import { SubflowList } from './SubflowList'
import { JacobsonAlternativeFlowList } from './JacobsonAlternativeFlowList'
import type { ValidationIssue } from '../../types'

interface FlowEditorProps {
  mainFlow: Step[]
  alternativeFlows: AlternativeFlow[]
  onChangeMainFlow: (steps: Step[]) => void
  onChangeAlternativeFlows: (flows: AlternativeFlow[]) => void
  issues?: ValidationIssue[]
  actors?: string[]
  highlightedStepIds?: Set<string>
  highlightedAltFlowIds?: Set<string>
  highlightUsername?: string
  // Jacobson-specific
  templateType?: TemplateType
  basicFlows?: BasicFlow[]
  subflows?: Subflow[]
  jacobsonAltFlows?: JacobsonAlternativeFlow[]
  onChangeBasicFlows?: (flows: BasicFlow[]) => void
  onChangeSubflows?: (subflows: Subflow[]) => void
  onChangeJacobsonAltFlows?: (flows: JacobsonAlternativeFlow[]) => void
}

export function FlowEditor({
  mainFlow, alternativeFlows,
  onChangeMainFlow, onChangeAlternativeFlows,
  issues = [],
  actors = [],
  highlightedStepIds,
  highlightedAltFlowIds,
  highlightUsername,
  templateType = 'cockburn',
  basicFlows = [],
  subflows = [],
  jacobsonAltFlows = [],
  onChangeBasicFlows,
  onChangeSubflows,
  onChangeJacobsonAltFlows,
}: FlowEditorProps) {
  const isJacobson = templateType === 'jacobson'
  const [tab, setTab] = useState<'main' | 'alt' | 'basic' | 'subflow'>(
    isJacobson ? 'basic' : 'main'
  )

  // Reset to appropriate default tab when template type changes
  useEffect(() => {
    if (isJacobson && tab === 'main') setTab('basic')
    if (!isJacobson && (tab === 'basic' || tab === 'subflow')) setTab('main')
  }, [isJacobson])

  const mainErrors = issues.filter(i => i.field.startsWith('mainFlow') && i.severity === 'error').length
  const altErrors = issues.filter(i => i.field.startsWith('alternativeFlows') && i.severity === 'error').length
  const basicErrors = issues.filter(i => i.field.startsWith('basicFlows') && i.severity === 'error').length
  const subflowErrors = issues.filter(i => i.field.startsWith('subflows') && i.severity === 'error').length
  const jacobsonAltErrors = issues.filter(i => i.field.startsWith('jacobsonAltFlows') && i.severity === 'error').length

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-3">
        {isJacobson ? (
          <>
            <TabButton label="Základné toky" active={tab === 'basic'} onClick={() => setTab('basic')}
              badge={basicFlows.length > 0 ? `(${basicFlows.length})` : undefined}
              errorCount={basicErrors} />
            <TabButton label="Alternatívne toky" active={tab === 'alt'} onClick={() => setTab('alt')}
              badge={jacobsonAltFlows.length > 0 ? `(${jacobsonAltFlows.length})` : undefined}
              errorCount={jacobsonAltErrors} />
            <TabButton label="Podtoky" active={tab === 'subflow'} onClick={() => setTab('subflow')}
              badge={subflows.length > 0 ? `(${subflows.length})` : undefined}
              errorCount={subflowErrors} />
          </>
        ) : (
          <>
            <TabButton label="Hlavný tok" active={tab === 'main'} onClick={() => setTab('main')}
              errorCount={mainErrors} />
            <TabButton label="Alternatívne toky" active={tab === 'alt'} onClick={() => setTab('alt')}
              badge={alternativeFlows.length > 0 ? `(${alternativeFlows.length})` : undefined}
              errorCount={altErrors} />
          </>
        )}
      </div>

      {tab === 'main' && (
        <StepList
          steps={mainFlow}
          onChange={onChangeMainFlow}
          issues={issues}
          fieldPrefix="mainFlow"
          actors={actors}
          highlightedStepIds={highlightedStepIds}
          highlightUsername={highlightUsername}
        />
      )}

      {tab === 'alt' && !isJacobson && (
        <AlternativeFlowList
          flows={alternativeFlows}
          mainFlow={mainFlow}
          onChange={onChangeAlternativeFlows}
          issues={issues}
          highlightedAltFlowIds={highlightedAltFlowIds}
          highlightUsername={highlightUsername}
        />
      )}

      {tab === 'alt' && isJacobson && (
        <JacobsonAlternativeFlowList
          flows={jacobsonAltFlows}
          basicFlows={basicFlows}
          onChange={onChangeJacobsonAltFlows ?? (() => {})}
          issues={issues}
          actors={actors}
        />
      )}

      {tab === 'basic' && (
        <BasicFlowList
          flows={basicFlows}
          onChange={onChangeBasicFlows ?? (() => {})}
          actors={actors}
          issues={issues}
        />
      )}

      {tab === 'subflow' && (
        <SubflowList
          subflows={subflows}
          onChange={onChangeSubflows ?? (() => {})}
          actors={actors}
          issues={issues}
        />
      )}
    </div>
  )
}

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  badge?: string
  errorCount?: number
}

function TabButton({ label, active, onClick, badge, errorCount = 0 }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors
        ${active
          ? 'border-teal-500 text-teal-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
      {label}
      {badge && <span className="ml-1.5 text-slate-400">{badge}</span>}
      {errorCount > 0 && (
        <span className="ml-1.5 px-1 py-0.5 bg-red-100 text-red-600 text-2xs rounded">{errorCount}</span>
      )}
    </button>
  )
}
