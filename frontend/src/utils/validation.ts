import type { UseCase, ValidationIssue, Relationship } from '../types'

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const SLOVAK_VERBS = new Set([
  // 3rd person present singular
  'informuje', 'ukončí', 'zneplatní', 'označí', 'zašifruje', 'zvolí',
  'zadá', 'vytvorí', 'vyberie', 'zobrazí', 'overí', 'odošle', 'prijme',
  'spracuje', 'potvrdí', 'zruší', 'načíta', 'uloží', 'odstráni', 'aktualizuje',
  'prihlási', 'odhlási', 'vráti', 'pošle', 'získa', 'skontroluje', 'vygeneruje',
  'vypočíta', 'nastaví', 'zapíše', 'prečíta', 'presmeruje', 'upozorní',
  'notifikuje', 'validuje', 'autorizuje', 'autentifikuje', 'vyhľadá', 'filtruje',
  'triedi', 'exportuje', 'importuje', 'stiahne', 'nahrá', 'vloží', 'vypíše',
  'registruje', 'aktivuje', 'deaktivuje', 'spustí', 'zastaví', 'otvorí',
  'zatvorí', 'odovzdá', 'schváli', 'zamietne', 'zaregistruje', 'skopíruje',
  'presunie', 'zlúči', 'rozdelí', 'pridá', 'odoberie', 'zmení', 'upraví',
  'ponúkne', 'umožní', 'zachová',
  // Present continuous / habitual
  'ponúka', 'umožňuje', 'zachováva',
  'zadáva', 'vytvára', 'vyberá', 'zobrazuje', 'overuje', 'odosiela', 'prijíma',
  'spracováva', 'potvrdzuje', 'ruší', 'načítava', 'ukladá', 'odstraňuje',
  'odhlasuje', 'vracia', 'posiela', 'získava', 'kontroluje', 'generuje',
  'vypočítava', 'nastavuje', 'zapisuje', 'číta', 'presmerúva', 'upozorňuje',
  'vyhľadáva', 'sťahuje', 'nahrúva', 'vkladá', 'vypisuje', 'spúšťa',
  'zastavuje', 'otvára', 'zatvára', 'odovzdáva', 'schvaľuje', 'zamieta',
  'mení', 'upravuje', 'informuje', 'ukončuje', 'zneplatňuje', 'označuje', 'šifruje', 'zvoľuje',
  // Infinitives
  'informovať', 'ukončiť', 'zneplatniť', 'označiť', 'zašifrovať', 'zvoliť',
  'zadať', 'vytvoriť', 'vybrať', 'zobraziť', 'overiť', 'odoslať', 'prijať',
  'spracovať', 'potvrdiť', 'zrušiť', 'načítať', 'uložiť', 'odstrániť',
  'aktualizovať', 'prihlásiť', 'odhlásiť', 'vrátiť', 'poslať', 'získať',
  'skontrolovať', 'vygenerovať', 'vypočítať', 'nastaviť', 'zapísať', 'prečítať',
  'presmerovať', 'upozorniť', 'notifikovať', 'validovať', 'autorizovať',
  'autentifikovať', 'vyhľadať', 'filtrovať', 'triediť', 'exportovať', 'importovať',
  'stiahnuť', 'nahrať', 'vložiť', 'vypísať', 'registrovať', 'aktivovať',
  'deaktivovať', 'spustiť', 'zastaviť', 'otvoriť', 'zatvoriť', 'odovzdať',
  'schváliť', 'zamietnuť', 'zmeniť', 'upraviť', 'pridať', 'odobrať',
  'ponúknuť', 'umožniť', 'zachovať',
  // English (for mixed projects)
  'enters', 'creates', 'selects', 'displays', 'verifies', 'sends', 'receives',
  'processes', 'confirms', 'cancels', 'loads', 'saves', 'removes', 'updates',
  'logs', 'returns', 'gets', 'checks', 'generates', 'sets', 'reads', 'redirects',
  'notifies', 'validates', 'authorizes', 'searches', 'filters', 'exports',
  'imports', 'downloads', 'uploads', 'inserts', 'registers', 'activates',
  'deactivates', 'starts', 'stops', 'opens', 'closes', 'submits', 'approves',
  'rejects', 'changes', 'edits', 'adds', 'deletes', 'copies', 'moves',
])

// Diacritic-free version of the verb set — built once at module load
const SLOVAK_VERBS_NORM = new Set([...SLOVAK_VERBS].map(stripDiacritics))

// Unicode tokenization instead of \b because Slovak diacritics (á, é, č…) break word-boundary assertions
function containsWholeWord(text: string, word: string): boolean {
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return tokens.some(t => t === word.toLowerCase())
}

// Consecutive-token match so multi-word UC names (e.g. "Nastaviť nové heslo") are found correctly
function containsPhrase(text: string, phrase: string): boolean {
  const textTokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  const phraseTokens = phrase.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  if (phraseTokens.length === 0) return false
  for (let i = 0; i <= textTokens.length - phraseTokens.length; i++) {
    if (phraseTokens.every((t, j) => textTokens[i + j] === t)) return true
  }
  return false
}

function checkActorAndVerb(
  text: string,
  field: string,
  stepNum: number,
  allActors: string[],
  issues: ValidationIssue[],
) {
  if (allActors.length === 0) return
  const lower = text.toLowerCase().trim()
  const firstToken = lower.split(/\s+/)[0] ?? ''
  const matchedActor = allActors.find(a => containsWholeWord(firstToken, a))
  if (!matchedActor) {
    issues.push({
      field,
      message: `Krok č. ${stepNum} by mal začínať menom aktéra (napr. „${allActors[0]} …")`,
      severity: 'warning',
    })
    return
  }

  const remainder = text.slice(matchedActor.length)
  const remainderLower = remainder.toLowerCase()

  // Multi-actor check: another actor name appears in the remainder
  const extraActor = allActors.find(a => containsWholeWord(remainderLower, a))
  if (extraActor) {
    issues.push({
      field,
      message: `Krok č. ${stepNum} spomína viac aktérov — zvážte rozdelenie na viac krokov`,
      severity: 'warning',
    })
  }

  const trimmedRemainder = remainder.trim()
  if (!trimmedRemainder) return

  const secondWord = trimmedRemainder.split(/\s+/)[0].toLowerCase().replace(/[.,;:!?]+$/, '')
  const normWord = stripDiacritics(secondWord)

  // Negation check: "ne" + known verb
  if (secondWord.startsWith('ne') && (SLOVAK_VERBS.has(secondWord.slice(2)) || SLOVAK_VERBS_NORM.has(normWord.slice(2)))) {
    issues.push({
      field,
      message: `Krok č. ${stepNum} obsahuje negáciu slovesa — zvážte presunutie do alternatívneho toku`,
      severity: 'warning',
    })
    return
  }

  // Verb check (with diacritic-free fallback)
  if (!SLOVAK_VERBS.has(secondWord) && !SLOVAK_VERBS_NORM.has(normWord)) {
    issues.push({
      field,
      message: `Krok č. ${stepNum}: za menom aktéra sa očakáva sloveso`,
      severity: 'warning',
    })
  }
}

const UI_PHRASES = [
  // Slovak
  'kliknúť', 'klikni', 'klikne', 'kliknite', 'klik',
  'stlačiť', 'stlačí', 'stlačte', 'stlač',
  'otvoriť okno', 'zatvoriť okno', 'otvoriť dialóg',
  'zadať do poľa', 'vyplniť formulár',
  'scrollovať', 'skrolovať',
  'rozbaľovaci', 'dropdown',
  // English
  'click', 'click on', 'click button',
  'open window', 'close window', 'open dialog',
  'fill in the form', 'fill out the form',
  'scroll', 'press button', 'select from dropdown',
]

function detectUIPhrase(text: string): string | null {
  const normText = stripDiacritics(text.toLowerCase())
  for (const phrase of UI_PHRASES) {
    if (normText.includes(stripDiacritics(phrase))) return phrase
  }
  return null
}

export function validateUseCase(
  uc: Partial<UseCase>,
  context?: { relationships?: Relationship[]; allUseCases?: UseCase[] },
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!uc.name?.trim()) {
    issues.push({
      field: 'name',
      message: 'Názov prípadu použitia je povinný',
      severity: 'error',
    })
  }

  if (!uc.primaryActor?.trim()) {
    issues.push({
      field: 'primaryActor',
      message: 'Primárny aktér je povinný',
      severity: 'error',
    })
  }

  if (!uc.goal?.trim()) {
    issues.push({
      field: 'goal',
      message: 'Cieľ prípadu použitia je povinný',
      severity: 'error',
    })
  }

  // Build actor list for step-level validation
  const allActors = [uc.primaryActor, ...(uc.supportingActors ?? [])]
    .filter((a): a is string => Boolean(a?.trim()))

  if (uc.templateType === 'jacobson') {
    // Jacobson uses basicFlows instead of mainFlow
    const basicFlows = uc.templateExtras?.basicFlows ?? []
    if (basicFlows.length === 0) {
      issues.push({
        field: 'basicFlows',
        message: 'Prípad použitia musí mať aspoň jeden základný tok',
        severity: 'error',
      })
    } else {
      basicFlows.forEach((flow, fi) => {
        if (!flow.steps || flow.steps.length === 0) {
          issues.push({
            field: `basicFlows[${fi}]`,
            message: `Základný tok „${flow.name}" musí obsahovať aspoň jeden krok`,
            severity: 'error',
          })
        } else {
          flow.steps.forEach((step, si) => {
            if (!step.text?.trim()) {
              issues.push({
                field: `basicFlows[${fi}][${si}]`,
                message: `Krok č. ${si + 1} nesmie byť prázdny`,
                severity: 'error',
              })
            } else {
              const phrase = detectUIPhrase(step.text)
              if (phrase) {
                issues.push({
                  field: `basicFlows[${fi}][${si}]`,
                  message: `Krok č. ${si + 1} obsahuje výraz závislý od UI: „${phrase}"`,
                  severity: 'warning',
                })
              }
              checkActorAndVerb(step.text, `basicFlows[${fi}][${si}]`, si + 1, allActors, issues)
            }
          })
        }
      })
    }

    // Jacobson alternative flow validations
    const jacobsonAltFlows = uc.templateExtras?.jacobsonAltFlows ?? []
    jacobsonAltFlows.forEach((alt, i) => {
      // Orphaned basic flow reference
      if (alt.triggeredByBasicFlowId) {
        const bf = basicFlows.find(b => b.id === alt.triggeredByBasicFlowId)
        if (!bf) {
          issues.push({
            field: `jacobsonAltFlows[${i}].triggeredByBasicFlowId`,
            message: `Alternatívny tok „${alt.label}" odkazuje na odstránený základný tok`,
            severity: 'error',
          })
        } else if (alt.triggeredByStepId && !bf.steps.some(s => s.id === alt.triggeredByStepId)) {
          issues.push({
            field: `jacobsonAltFlows[${i}].triggeredByStepId`,
            message: `Spúšťací krok alternatívneho toku „${alt.label}" bol odstránený zo základného toku`,
            severity: 'error',
          })
        }
      }

      if (!alt.condition?.trim()) {
        issues.push({
          field: `jacobsonAltFlows[${i}].condition`,
          message: `Alternatívny tok '${alt.label}' musí mať definovanú podmienku/popis`,
          severity: 'error',
        })
      }
      if (!alt.steps || alt.steps.length === 0) {
        issues.push({
          field: `jacobsonAltFlows[${i}]`,
          message: `Alternatívny tok „${alt.label}" musí mať aspoň jeden krok`,
          severity: 'error',
        })
      } else {
        alt.steps.forEach((step, si) => {
          if (!step.text?.trim()) {
            issues.push({
              field: `jacobsonAltFlows[${i}].steps[${si}]`,
              message: `Krok č. ${si + 1} nesmie byť prázdny`,
              severity: 'error',
            })
          } else {
            const phrase = detectUIPhrase(step.text)
            if (phrase) {
              issues.push({
                field: `jacobsonAltFlows[${i}].steps[${si}]`,
                message: `Krok č. ${si + 1} obsahuje výraz závislý od UI: „${phrase}"`,
                severity: 'warning',
              })
            }
            checkActorAndVerb(step.text, `jacobsonAltFlows[${i}].steps[${si}]`, si + 1, allActors, issues)
          }
        })
      }
    })

    // Subflow step validations
    const subflows = uc.templateExtras?.subflows ?? []
    subflows.forEach((sf, si) => {
      sf.steps.forEach((step, ssi) => {
        if (!step.text?.trim()) {
          issues.push({
            field: `subflows[${si}][${ssi}]`,
            message: `Krok č. ${ssi + 1} nesmie byť prázdny`,
            severity: 'error',
          })
        } else {
          const phrase = detectUIPhrase(step.text)
          if (phrase) {
            issues.push({
              field: `subflows[${si}][${ssi}]`,
              message: `Krok č. ${ssi + 1} obsahuje výraz závislý od UI: „${phrase}"`,
              severity: 'warning',
            })
          }
          checkActorAndVerb(step.text, `subflows[${si}][${ssi}]`, ssi + 1, allActors, issues)
        }
      })
    })
  } else {
    if (!uc.mainFlow || uc.mainFlow.length === 0) {
      issues.push({
        field: 'mainFlow',
        message: 'Hlavný tok musí obsahovať aspoň jeden krok',
        severity: 'error',
      })
    } else {
      uc.mainFlow.forEach((step, i) => {
        if (!step.text?.trim()) {
          issues.push({
            field: `mainFlow[${i}]`,
            message: `Krok č. ${i + 1} nesmie byť prázdny`,
            severity: 'error',
          })
        } else {
          const phrase = detectUIPhrase(step.text)
          if (phrase) {
            issues.push({
              field: `mainFlow[${i}]`,
              message: `Krok č. ${i + 1} obsahuje výraz závislý od UI: „${phrase}"`,
              severity: 'warning',
            })
          }
          checkActorAndVerb(step.text, `mainFlow[${i}]`, i + 1, allActors, issues)
        }
      })
    }
  }

  if (!uc.preconditions || uc.preconditions.length === 0) {
    issues.push({
      field: 'preconditions',
      message: 'Odporúča sa definovať aspoň jednu predpodmienku',
      severity: 'warning',
    })
  }

  if (!uc.postconditions || uc.postconditions.length === 0) {
    issues.push({
      field: 'postconditions',
      message: 'Odporúča sa definovať aspoň jednu postpodmienku',
      severity: 'warning',
    })
  }

  uc.alternativeFlows?.forEach((alt, i) => {
    // Check for orphaned step reference
    if (alt.triggeredByStepId) {
      const stepExists = uc.mainFlow?.some(s => s.id === alt.triggeredByStepId)
      if (!stepExists) {
        issues.push({
          field: `alternativeFlows[${i}].triggeredByStepId`,
          message: `Spúšťací krok alternatívneho toku „${alt.label}" bol odstránený z hlavného toku`,
          severity: 'error',
        })
      }
    }

    if (!alt.condition?.trim()) {
      issues.push({
        field: `alternativeFlows[${i}].condition`,
        message: `Alternatívny tok '${alt.label || i + 1}' musí mať definovanú podmienku/popis`,
        severity: 'error',
      })
    }
    if (!alt.steps || alt.steps.length === 0) {
      issues.push({
        field: `alternativeFlows[${i}]`,
        message: `Alternatívny tok „${alt.label || i + 1}" musí mať aspoň jeden krok`,
        severity: 'error',
      })
    } else {
      alt.steps.forEach((step, j) => {
        if (!step.text?.trim()) {
          issues.push({
            field: `alternativeFlows[${i}].steps[${j}]`,
            message: `Krok č. ${j + 1} v alternatívnom toku „${alt.label}" nesmie byť prázdny`,
            severity: 'error',
          })
        } else {
          const phrase = detectUIPhrase(step.text)
          if (phrase) {
            issues.push({
              field: `alternativeFlows[${i}].steps[${j}]`,
              message: `Krok v toku „${alt.label}" obsahuje výraz závislý od UI: „${phrase}"`,
              severity: 'warning',
            })
          }
          checkActorAndVerb(step.text, `alternativeFlows[${i}].steps[${j}]`, j + 1, allActors, issues)
        }
      })
    }
  })

  // Include relationship check: the included UC's name must appear in at least one step
  if (uc.id && context?.relationships && context?.allUseCases) {
    const includeRels = context.relationships.filter(
      r => r.sourceId === uc.id && r.type === 'include',
    )
    for (const rel of includeRels) {
      const target = context.allUseCases.find(u => u.id === rel.targetId)
      if (!target) continue

      const allStepTexts: string[] = []
      if (uc.templateType === 'jacobson') {
        const basicFlows = uc.templateExtras?.basicFlows ?? []
        for (const flow of basicFlows) {
          for (const step of flow.steps ?? []) allStepTexts.push(step.text)
        }
      } else {
        for (const step of uc.mainFlow ?? []) allStepTexts.push(step.text)
      }

      const mentioned = allStepTexts.some(text => containsPhrase(text, target.name))
      if (!mentioned) {
        issues.push({
          field: uc.templateType === 'jacobson' ? 'basicFlows' : 'mainFlow',
          message: `Prípad použitia zahŕňa „${target.name}", ale jeho názov sa nespomína v žiadnom kroku toku — označte, kde sa zahrnutie vykonáva`,
          severity: 'warning',
        })
      }
    }
  }

  return issues
}

export function getIssuesForField(issues: ValidationIssue[], field: string): ValidationIssue[] {
  return issues.filter(i => i.field === field || i.field.startsWith(field))
}

export function hasError(issues: ValidationIssue[], field: string): boolean {
  return getIssuesForField(issues, field).some(i => i.severity === 'error')
}
