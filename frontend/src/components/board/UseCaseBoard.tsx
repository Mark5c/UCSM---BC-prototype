import { useState } from 'react'
import { useUseCases } from '../../context/UseCaseContext'
import { useProject } from '../../context/ProjectContext'
import { UseCaseBoardGroup } from './UseCaseBoardGroup'
import { BOARD_TEMPLATES, type BoardTemplate } from '../../data/boardTemplates'
import { relationshipsApi } from '../../api/relationships'

export function UseCaseBoard() {
  const { activeProject } = useProject()
  const { groups, useCases, createGroup, createUseCase } = useUseCases()
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const handleSelectTemplate = (tpl: BoardTemplate) => {
    if (selectedTemplate?.id === tpl.id) {
      setSelectedTemplate(null)
      setNewGroupName('')
    } else {
      setSelectedTemplate(tpl)
      setNewGroupName(tpl.name)
    }
  }

  const handleCancel = () => {
    setAddingGroup(false)
    setNewGroupName('')
    setSelectedTemplate(null)
  }

  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (!name || !activeProject) return
    try {
      setCreating(true)
      const group = await createGroup(activeProject.id, name)

      if (selectedTemplate) {
        const ucIds: string[] = []
        for (const ucDef of selectedTemplate.useCases) {
          const basicFlowId = `bf-${Math.random().toString(36).slice(2)}`
          const uc = await createUseCase(activeProject.id, {
            name: ucDef.name,
            templateType: 'cockburn',
            primaryActor: ucDef.primaryActor,
            supportingActors: ucDef.supportingActors,
            goal: ucDef.goal,
            preconditions: ucDef.preconditions,
            postconditions: ucDef.postconditions,
            mainFlow: ucDef.mainFlow,
            alternativeFlows: ucDef.alternativeFlows,
            templateExtras: {
              basicFlows: [{ id: basicFlowId, name: 'Základný tok', steps: ucDef.mainFlow }],
              jacobsonAltFlows: ucDef.alternativeFlows.map(af => ({
                ...af,
                id: `tpl-jaf-${Math.random().toString(36).slice(2, 7)}`,
                triggeredByBasicFlowId: basicFlowId,
              })),
            },
            groupId: group.id,
          })
          ucIds.push(uc.id)
        }
        for (const rel of selectedTemplate.relationships) {
          await relationshipsApi.create(
            activeProject.id,
            ucIds[rel.sourceIndex],
            ucIds[rel.targetIndex],
            rel.type,
          )
        }
      }
    } finally {
      setCreating(false)
      setNewGroupName('')
      setAddingGroup(false)
      setSelectedTemplate(null)
    }
  }

  const sortedGroups = [...groups].sort((a, b) => a.position - b.position)
  const ungrouped = useCases.filter(uc => !uc.groupId || !groups.some(g => g.id === uc.groupId))

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">{activeProject?.name}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {useCases.length} prípadov použitia · {groups.length} skupín
        </p>
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full px-6 py-5 items-start">

          {/* Ungrouped column */}
          {ungrouped.length > 0 && (
            <UseCaseBoardGroup
              group={{ id: '__ungrouped__', projectId: activeProject?.id ?? '', name: 'Nepriradené', position: -1 }}
              useCases={ungrouped}
              deletable={false}
            />
          )}

          {/* Named groups */}
          {sortedGroups.map(group => (
            <UseCaseBoardGroup
              key={group.id}
              group={group}
              useCases={useCases.filter(uc => uc.groupId === group.id)}
            />
          ))}

          {/* Add group */}
          <div className="flex-shrink-0 w-72">
            {addingGroup ? (
              <div className="rounded-xl border-2 border-teal-400 bg-teal-50/40 p-3 space-y-3">

                {/* Name input */}
                <input
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateGroup()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  placeholder="Názov skupiny..."
                  className="w-full text-sm border border-teal-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-teal-400 bg-white"
                  autoFocus
                />

                {/* Predefined templates */}
                <div>
                  <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Šablóna (voliteľné)
                  </p>
                  <div className="space-y-1.5">
                    {BOARD_TEMPLATES.map(tpl => {
                      const isSelected = selectedTemplate?.id === tpl.id
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-400/30'
                              : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700">{tpl.name}</p>
                              <p className="text-2xs text-slate-400 leading-tight mt-0.5">{tpl.description}</p>
                            </div>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {isSelected && (
                            <p className="text-2xs text-teal-600 mt-1.5 font-medium">
                              {tpl.useCases.length} prípadov použitia · {tpl.relationships.length} vzťahov
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || creating}
                    className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {creating && (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    )}
                    {creating ? 'Vytváram…' : 'Vytvoriť'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={creating}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    Zrušiť
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingGroup(true)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/30 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nová skupina
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
