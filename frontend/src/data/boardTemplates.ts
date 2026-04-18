import type { RelationshipType, Step } from '../types'

export interface TemplateUseCase {
  name: string
  primaryActor: string
  supportingActors: string[]
  goal: string
  preconditions: string[]
  postconditions: string[]
  mainFlow: Step[]
}

export interface TemplateRelationship {
  sourceIndex: number
  targetIndex: number
  type: RelationshipType
}

export interface BoardTemplate {
  id: string
  name: string
  description: string
  useCases: TemplateUseCase[]
  relationships: TemplateRelationship[]
}

function steps(...texts: string[]): Step[] {
  return texts.map((text, i) => ({
    id: `tpl-step-${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
    order: i + 1,
    text,
  }))
}

const authUseCases: TemplateUseCase[] = [
  {
    name: 'Registrovať používateľa',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Zaregistrovať nového používateľa do systému.',
    preconditions: [
      'Používateľ nie je prihlásený.',
      'Používateľ má platnú e-mailovú adresu.',
    ],
    postconditions: [
      'Vytvorený nový účet v systéme.',
      'Odoslaný overovací e-mail na zadanú adresu.',
    ],
    mainFlow: steps(
      'Používateľ otvorí registračný formulár.',
      'Používateľ zadá meno, e-mailovú adresu a heslo.',
      'Systém overí správnosť a úplnosť zadaných údajov.',
      'Systém skontroluje, či e-mailová adresa nie je už registrovaná.',
      'Systém vytvorí nový používateľský účet.',
      'Systém spustí Overiť e-mail.',
      'Systém informuje používateľa o úspešnom dokončení registrácie.',
    ),
  },
  {
    name: 'Prihlásiť používateľa',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Prihlásiť sa do systému pomocou prihlasovacích údajov.',
    preconditions: [
      'Používateľ má existujúci a aktívny účet.',
      'Používateľ nie je prihlásený.',
    ],
    postconditions: [
      'Používateľ je úspešne prihlásený.',
      'Vytvorená aktívna prihlasovacia relácia.',
    ],
    mainFlow: steps(
      'Používateľ otvorí prihlasovaciu stránku.',
      'Používateľ zadá e-mailovú adresu a heslo.',
      'Systém overí zadané prihlasovacie údaje.',
      'Systém vytvorí novú prihlasovaciu reláciu.',
      'Systém presmeruje používateľa na hlavnú stránku aplikácie.',
    ),
  },
  {
    name: 'Obnoviť heslo',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Obnoviť prístup k účtu prostredníctvom e-mailu.',
    preconditions: [
      'Používateľ má existujúci účet.',
      'Používateľ nie je prihlásený.',
    ],
    postconditions: [
      'Odoslaný e-mail s odkazom na obnovu hesla.',
      'Vygenerovaný jednorazový token platný po obmedzenú dobu.',
    ],
    mainFlow: steps(
      'Používateľ zvolí možnosť „Zabudol som heslo".',
      'Používateľ zadá svoju registrovanú e-mailovú adresu.',
      'Systém overí, či e-mailová adresa existuje v databáze.',
      'Systém vygeneruje jednorazový token na obnovu hesla.',
      'Systém odošle e-mail Potvrdiť žiadosť.',
    ),
  },
  {
    name: 'Aktualizovať profil',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Aktualizovať osobné údaje a nastavenia profilu.',
    preconditions: [
      'Používateľ je prihlásený.',
    ],
    postconditions: [
      'Profil používateľa je aktualizovaný.',
      'Zmeny sú uložené v systéme.',
    ],
    mainFlow: steps(
      'Používateľ otvorí stránku nastavení profilu.',
      'Systém zobrazí aktuálne uložené údaje profilu.',
      'Používateľ upraví požadované údaje.',
      'Systém overí správnosť a formát zadaných údajov.',
      'Systém uloží aktualizované údaje.',
      'Systém informuje používateľa o úspešnej aktualizácii profilu.',
    ),
  },
  {
    name: 'Odhlásiť používateľa',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Bezpečne sa odhlásiť zo systému.',
    preconditions: [
      'Používateľ je prihlásený.',
    ],
    postconditions: [
      'Prihlasovacia relácia je ukončená.',
      'Autentifikačné tokeny sú zneplatnené.',
      'Používateľ nie je prihlásený.',
    ],
    mainFlow: steps(
      'Používateľ zvolí možnosť „Odhlásiť sa".',
      'Systém ukončí aktívnu prihlasovaciu reláciu.',
      'Systém zneplatní autentifikačné tokeny.',
      'Systém presmeruje používateľa na prihlasovaciu stránku.',
    ),
  },
  {
    name: 'Overiť e-mail',
    primaryActor: 'Systém',
    supportingActors: ['Používateľ'],
    goal: 'Overiť e-mailovú adresu nového používateľa.',
    preconditions: [
      'Registrácia prebehla úspešne.',
    ],
    postconditions: [
      'E-mailová adresa je overená.',
      'Používateľský účet je aktivovaný.',
    ],
    mainFlow: steps(
      'Systém odošle overovací e-mail na zadanú adresu.',
      'Používateľ otvorí overovací odkaz zaslaný e-mailom.',
      'Systém overí platnosť a expiráciu overovacieho tokenu.',
      'Systém aktivuje používateľský účet.',
      'Systém informuje používateľa o úspešnom overení e-mailu.',
    ),
  },
  {
    name: 'Potvrdiť žiadosť',
    primaryActor: 'Systém',
    supportingActors: ['Používateľ'],
    goal: 'Potvrdiť žiadosť o obnovu hesla a sprístupniť formulár.',
    preconditions: [
      'Žiadosť o obnovu hesla bola odoslaná.',
      'Token na obnovu hesla je platný a neexpiroval.',
    ],
    postconditions: [
      'Žiadosť je potvrdená.',
      'Formulár na zadanie nového hesla je sprístupnený.',
    ],
    mainFlow: steps(
      'Používateľ otvorí odkaz na obnovu hesla z e-mailu.',
      'Systém overí platnosť a expiráciu tokenu.',
      'Systém zobrazí formulár na zadanie nového hesla.',
      'Systém označí token ako použitý.',
      'Systém spustí Nastaviť nové heslo.',
    ),
  },
  {
    name: 'Nastaviť nové heslo',
    primaryActor: 'Systém',
    supportingActors: ['Používateľ'],
    goal: 'Nastaviť nové heslo po overení identity používateľa.',
    preconditions: [
      'Token na obnovu hesla bol úspešne potvrdený.',
      'Formulár na zadanie nového hesla je zobrazený.',
    ],
    postconditions: [
      'Heslo používateľa je aktualizované.',
      'Všetky aktívne relácie sú ukončené.',
      'Používateľ je presmerovaný na prihlásenie.',
    ],
    mainFlow: steps(
      'Používateľ zadá nové heslo a jeho potvrdenie.',
      'Systém overí, že obe heslá sa zhodujú.',
      'Systém skontroluje, že heslo spĺňa bezpečnostné požiadavky.',
      'Systém zašifruje a uloží nové heslo.',
      'Systém ukončí všetky aktívne relácie daného používateľa.',
      'Systém presmeruje používateľa na prihlasovaciu stránku.',
    ),
  },
]

const authRelationships: TemplateRelationship[] = [
  { sourceIndex: 0, targetIndex: 5, type: 'include' }, // Registrácia       → Overenie e-mailu
  { sourceIndex: 2, targetIndex: 6, type: 'include' }, // Obnova hesla      → Potvrdenie žiadosti
  { sourceIndex: 6, targetIndex: 7, type: 'include' }, // Obnova hesla      → Nastavenie nového hesla
]

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'authorization',
    name: 'Autorizácia',
    description: 'Registrácia, prihlásenie, obnova hesla a správa profilu.',
    useCases: authUseCases,
    relationships: authRelationships,
  },
]
