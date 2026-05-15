import type { RelationshipType, Step, AlternativeFlow } from '../types'

export interface TemplateUseCase {
  name: string
  primaryActor: string
  supportingActors: string[]
  goal: string
  preconditions: string[]
  postconditions: string[]
  mainFlow: Step[]
  alternativeFlows: AlternativeFlow[]
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

function altFlow(
  label: string,
  name: string,
  condition: string,
  triggeredByStepId: string | undefined,
  ...stepTexts: string[]
): AlternativeFlow {
  return {
    id: `tpl-af-${label.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    name,
    condition,
    triggeredByStepId,
    steps: steps(...stepTexts),
  }
}

// ── Pre-computed main flows (IDs are stable at module init time) ─────────────

const registrujSaFlow = steps(
  'Používateľ otvorí registračný formulár.',
  'Používateľ zadá meno, e-mailovú adresu a heslo.',
  'Systém overí správnosť a úplnosť zadaných údajov.',
  'Systém skontroluje, či e-mailová adresa nie je už registrovaná.',
  'Systém vytvorí nový používateľský účet.',
  'Systém spustí Over e-mail.',
  'Systém informuje používateľa o úspešnom dokončení registrácie.',
)

const prihlaSaFlow = steps(
  'Používateľ otvorí prihlasovaciu stránku.',
  'Používateľ zadá e-mailovú adresu a heslo.',
  'Systém overí zadané prihlasovacie údaje.',
  'Systém vytvorí novú prihlasovaciu reláciu.',
  'Systém presmeruje používateľa na hlavnú stránku aplikácie.',
)

const obnovSiHesloFlow = steps(
  'Používateľ zvolí možnosť „Zabudol som heslo".',
  'Používateľ zadá svoju registrovanú e-mailovú adresu.',
  'Systém overí, či e-mailová adresa existuje v databáze.',
  'Systém vygeneruje jednorazový token na obnovu hesla.',
  'Systém odošle e-mail Potvrď žiadosť.',
)

const aktualizujProfilFlow = steps(
  'Používateľ otvorí stránku nastavení profilu.',
  'Systém zobrazí aktuálne uložené údaje profilu.',
  'Používateľ upraví požadované údaje.',
  'Systém overí správnosť a formát zadaných údajov.',
  'Systém uloží aktualizované údaje.',
  'Systém informuje používateľa o úspešnej aktualizácii profilu.',
)

const odhlaSaFlow = steps(
  'Používateľ zvolí možnosť „Odhlásiť sa".',
  'Systém ukončí aktívnu prihlasovaciu reláciu.',
  'Systém zneplatní autentifikačné tokeny.',
  'Systém presmeruje používateľa na prihlasovaciu stránku.',
)

const overEmailFlow = steps(
  'Systém odošle overovací e-mail na zadanú adresu.',
  'Používateľ otvorí overovací odkaz zaslaný e-mailom.',
  'Systém overí platnosť a expiráciu overovacieho tokenu.',
  'Systém aktivuje používateľský účet.',
  'Systém informuje používateľa o úspešnom overení e-mailu.',
)

const potvrdZiadostFlow = steps(
  'Používateľ otvorí odkaz na obnovu hesla z e-mailu.',
  'Systém overí platnosť a expiráciu tokenu.',
  'Systém zobrazí formulár na zadanie nového hesla.',
  'Systém označí token ako použitý.',
  'Systém spustí Nastav nové heslo.',
)

const nastavNoveHesloFlow = steps(
  'Používateľ zadá nové heslo a jeho potvrdenie.',
  'Systém overí, že obe heslá sa zhodujú.',
  'Systém skontroluje, že heslo spĺňa bezpečnostné požiadavky.',
  'Systém zašifruje a uloží nové heslo.',
  'Systém ukončí všetky aktívne relácie daného používateľa.',
  'Systém presmeruje používateľa na prihlasovaciu stránku.',
)

// ── Use cases ────────────────────────────────────────────────────────────────

const authUseCases: TemplateUseCase[] = [
  {
    name: 'Registruj sa',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Zaregistrovať sa do systému.',
    preconditions: [
      'Používateľ nie je prihlásený.',
      'Používateľ má platnú e-mailovú adresu.',
    ],
    postconditions: [
      'Vytvorený nový účet v systéme.',
      'Odoslaný overovací e-mail na zadanú adresu.',
    ],
    mainFlow: registrujSaFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni duplicitnú registráciu',
        'V kroku 4 hlavného toku, ak e-mailová adresa už existuje v databáze',
        registrujSaFlow[3].id,
        'Systém zobrazí hlásenie, že zadaná e-mailová adresa už je registrovaná.',
        'Systém ponúkne používateľovi možnosť prihlásiť sa alebo obnoviť heslo.',
      ),
    ],
  },
  {
    name: 'Prihlás sa',
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
    mainFlow: prihlaSaFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni neplatné prihlásenie',
        'V kroku 3 hlavného toku, ak zadané prihlasovacie údaje nesúhlasia',
        prihlaSaFlow[2].id,
        'Systém zobrazí hlásenie o nesprávnych prihlasovacích údajoch.',
        'Systém umožní opätovné zadanie údajov bez odhalenia, ktoré z polí bolo nesprávne.',
      ),
    ],
  },
  {
    name: 'Obnov si heslo',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Obnoviť si prístup k účtu prostredníctvom e-mailu.',
    preconditions: [
      'Používateľ má existujúci účet.',
      'Používateľ nie je prihlásený.',
    ],
    postconditions: [
      'Odoslaný e-mail s odkazom na obnovu hesla.',
      'Vygenerovaný jednorazový token platný po obmedzenú dobu.',
    ],
    mainFlow: obnovSiHesloFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni neznámy e-mail',
        'V kroku 3 hlavného toku, ak zadaná e-mailová adresa nie je registrovaná',
        obnovSiHesloFlow[2].id,
        'Systém zobrazí hlásenie, že zadaná adresa nie je v systéme registrovaná.',
      ),
    ],
  },
  {
    name: 'Aktualizuj si profil',
    primaryActor: 'Používateľ',
    supportingActors: ['Systém'],
    goal: 'Aktualizovať si osobné údaje a nastavenia profilu.',
    preconditions: [
      'Používateľ je prihlásený.',
    ],
    postconditions: [
      'Profil používateľa je aktualizovaný.',
      'Zmeny sú uložené v systéme.',
    ],
    mainFlow: aktualizujProfilFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni neplatné údaje',
        'V kroku 4 hlavného toku, ak zadané údaje nespĺňajú požadovaný formát',
        aktualizujProfilFlow[3].id,
        'Systém označí polia s neplatnými údajmi a zobrazí dôvod odmietnutia.',
        'Systém zachová pôvodne uložené údaje v profile bez zmeny.',
      ),
    ],
  },
  {
    name: 'Odhlás sa',
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
    mainFlow: odhlaSaFlow,
    alternativeFlows: [],
  },
  {
    name: 'Over e-mail',
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
    mainFlow: overEmailFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni neplatný token',
        'V kroku 3 hlavného toku, ak overovací token vypršal alebo nie je platný',
        overEmailFlow[2].id,
        'Systém zobrazí hlásenie o expirácii alebo neplatnosti overovacieho odkazu.',
        'Systém ponúkne možnosť opätovne odoslať overovací e-mail.',
      ),
    ],
  },
  {
    name: 'Potvrď žiadosť',
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
    mainFlow: potvrdZiadostFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni expirovaný token',
        'V kroku 2 hlavného toku, ak token na obnovu hesla už vypršal',
        potvrdZiadostFlow[1].id,
        'Systém zobrazí hlásenie o vypršaní žiadosti o obnovu hesla.',
        'Systém ponúkne možnosť opätovne vygenerovať žiadosť cez Obnov si heslo.',
      ),
    ],
  },
  {
    name: 'Nastav nové heslo',
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
    mainFlow: nastavNoveHesloFlow,
    alternativeFlows: [
      altFlow(
        'A1',
        'Odmietni nezhodné heslá',
        'V kroku 2 hlavného toku, ak sa zadané heslá nezhodujú',
        nastavNoveHesloFlow[1].id,
        'Systém zobrazí hlásenie, že zadané heslá sa nezhodujú.',
        'Systém zachová formulár otvorený pre opätovné zadanie.',
      ),
      altFlow(
        'A2',
        'Odmietni slabé heslo',
        'V kroku 3 hlavného toku, ak heslo nespĺňa bezpečnostné požiadavky',
        nastavNoveHesloFlow[2].id,
        'Systém vypíše konkrétne bezpečnostné požiadavky, ktoré heslo nespĺňa.',
        'Systém zachová formulár otvorený pre opätovné zadanie.',
      ),
    ],
  },
]

const authRelationships: TemplateRelationship[] = [
  { sourceIndex: 0, targetIndex: 5, type: 'include' }, // Registruj sa        → Over e-mail
  { sourceIndex: 2, targetIndex: 6, type: 'include' }, // Obnov si heslo      → Potvrď žiadosť
  { sourceIndex: 6, targetIndex: 7, type: 'include' }, // Potvrď žiadosť      → Nastav nové heslo
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
