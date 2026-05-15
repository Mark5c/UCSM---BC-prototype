import unicodedata
from typing import List, Optional
from models import ValidationIssue, UseCaseResponse


def strip_diacritics(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

SLOVAK_VERBS = {
    # 3rd person present singular (most common in use case steps)
    "zadá", "vytvorí", "vyberie", "zobrazí", "overí", "odošle", "prijme",
    "spracuje", "potvrdí", "zruší", "načíta", "uloží", "odstráni", "aktualizuje",
    "prihlási", "odhlási", "vráti", "pošle", "získa", "skontroluje", "vygeneruje",
    "vypočíta", "nastaví", "zapíše", "prečíta", "presmeruje", "upozorní",
    "notifikuje", "validuje", "autorizuje", "autentifikuje", "vyhľadá", "filtruje",
    "triedi", "exportuje", "importuje", "stiahne", "nahrá", "vloží", "vypíše",
    "registruje", "aktivuje", "deaktivuje", "spustí", "zastaví", "otvorí",
    "zatvorí", "odovzdá", "schváli", "zamietne", "zaregistruje", "skopíruje",
    "presunie", "zlúči", "rozdelí", "pridá", "odoberie", "zmení", "upraví",
    "ponúkne", "umožní", "zachová",
    # Present continuous / habitual forms
    "ponúka", "umožňuje", "zachováva",
    "zadáva", "vytvára", "vyberá", "zobrazuje", "overuje", "odosiela", "prijíma",
    "spracováva", "potvrdzuje", "ruší", "načítava", "ukladá", "odstraňuje",
    "odhlasuje", "vracia", "posiela", "získava", "kontroluje", "generuje",
    "vypočítava", "nastavuje", "zapisuje", "číta", "presmerúva", "upozorňuje",
    "vyhľadáva", "exportuje", "importuje", "sťahuje", "nahrúva", "vkladá",
    "vypisuje", "spúšťa", "zastavuje", "otvára", "zatvára", "odovzdáva",
    "schvaľuje", "zamieta", "mení", "upravuje",
    # Infinitives
    "zadať", "vytvoriť", "vybrať", "zobraziť", "overiť", "odoslať", "prijať",
    "spracovať", "potvrdiť", "zrušiť", "načítať", "uložiť", "odstrániť",
    "aktualizovať", "prihlásiť", "odhlásiť", "vrátiť", "poslať", "získať",
    "skontrolovať", "vygenerovať", "vypočítať", "nastaviť", "zapísať", "prečítať",
    "presmerovať", "upozorniť", "notifikovať", "validovať", "autorizovať",
    "autentifikovať", "vyhľadať", "filtrovať", "triediť", "exportovať", "importovať",
    "stiahnuť", "nahrať", "vložiť", "vypísať", "registrovať", "aktivovať",
    "deaktivovať", "spustiť", "zastaviť", "otvoriť", "zatvoriť", "odovzdať",
    "schváliť", "zamietnuť", "zmeniť", "upraviť", "pridať", "odobrať",
    "ponúknuť", "umožniť", "zachovať",
    # English (for mixed projects)
    "enters", "creates", "selects", "displays", "verifies", "sends", "receives",
    "processes", "confirms", "cancels", "loads", "saves", "removes", "updates",
    "logs", "returns", "gets", "checks", "generates", "sets", "reads", "redirects",
    "notifies", "validates", "authorizes", "searches", "filters", "exports",
    "imports", "downloads", "uploads", "inserts", "registers", "activates",
    "deactivates", "starts", "stops", "opens", "closes", "submits", "approves",
    "rejects", "changes", "edits", "adds", "deletes", "copies", "moves",
}

# Diacritic-free version of the verb set
SLOVAK_VERBS_NORM = {strip_diacritics(v) for v in SLOVAK_VERBS}

UI_PHRASES = [
    # Slovak
    "kliknúť", "klikni", "klikne", "kliknite",
    "stlačiť", "stlačí", "stlačte",
    "otvoriť okno", "zatvoriť okno", "otvoriť dialóg",
    "zadať do poľa", "vyplniť formulár",
    "scrollovať", "skrolovať",
    "rozbaľovaci", "dropdown",
    # English
    "click", "click on", "click button",
    "open window", "close window", "open dialog",
    "fill in the form", "fill out the form",
    "scroll", "press button", "select from dropdown",
]

# Diacritic-free version of UI phrases
UI_PHRASES_NORM = [strip_diacritics(p) for p in UI_PHRASES]


def _check_actor_and_verb(
    text: str,
    field: str,
    step_num: int,
    all_actors: List[str],
    issues: List[ValidationIssue],
):
    """Check that the step starts with a known actor, then a verb."""
    if not all_actors:
        return
    lower = text.lower().strip()
    matched_actor: Optional[str] = None
    for actor in all_actors:
        if lower.startswith(actor.lower()):
            matched_actor = actor
            break
    if matched_actor is None:
        issues.append(ValidationIssue(
            field=field,
            message=f"Krok c. {step_num} by mal zacinat menom aktera (napr. '{all_actors[0]} ...')",
            severity="warning",
        ))
        return

    remainder = text[len(matched_actor):]
    remainder_lower = remainder.lower()

    # Multi-actor check if another actor name appears
    extra_actor = next((a for a in all_actors if a.lower() in remainder_lower), None)
    if extra_actor:
        issues.append(ValidationIssue(
            field=field,
            message=f"Krok č. {step_num} spomína viac aktérov — zvážte rozdelenie na viac krokov",
            severity="warning",
        ))

    # Verb check
    remaining_stripped = remainder.strip()
    if not remaining_stripped:
        return
    second_word = remaining_stripped.split()[0].lower().rstrip(".,;:!?")
    norm_word = strip_diacritics(second_word)

    # Negation check: "ne" + verb
    if second_word.startswith("ne") and (
        second_word[2:] in SLOVAK_VERBS or norm_word[2:] in SLOVAK_VERBS_NORM
    ):
        issues.append(ValidationIssue(
            field=field,
            message=f"Krok č. {step_num} obsahuje negáciu slovesa — zvážte presunutie do alternatívneho toku",
            severity="warning",
        ))
        return

    # Verb check (with diacritic-free verbs)
    if second_word not in SLOVAK_VERBS and norm_word not in SLOVAK_VERBS_NORM:
        issues.append(ValidationIssue(
            field=field,
            message=f"Krok č. {step_num}: za menom aktéra sa očakáva sloveso",
            severity="warning",
        ))


def _check_ui_phrases(text: str, field: str, issues: List[ValidationIssue]):
    norm_text = strip_diacritics(text.lower())
    for phrase, norm_phrase in zip(UI_PHRASES, UI_PHRASES_NORM):
        if norm_phrase in norm_text:
            issues.append(ValidationIssue(
                field=field,
                message=f'Krok obsahuje výraz závislý od používateľského rozhrania: "{phrase}"',
                severity="warning",
            ))
            break


def validate_use_case(uc: UseCaseResponse) -> List[ValidationIssue]:
    issues: List[ValidationIssue] = []

    if not uc.name or not uc.name.strip():
        issues.append(ValidationIssue(
            field="name",
            message="Názov prípadu použitia je povinný",
            severity="error",
        ))

    if not uc.primary_actor or not uc.primary_actor.strip():
        issues.append(ValidationIssue(
            field="primaryActor",
            message="Primárny aktér je povinný",
            severity="error",
        ))

    if not uc.goal or not uc.goal.strip():
        issues.append(ValidationIssue(
            field="goal",
            message="Cieľ prípadu použitia je povinný",
            severity="error",
        ))

    # Build actor list for step validation
    all_actors = [a for a in [uc.primary_actor] + list(uc.supporting_actors) if a and a.strip()]

    if not uc.main_flow:
        issues.append(ValidationIssue(
            field="mainFlow",
            message="Hlavný tok musí obsahovať aspoň jeden krok",
            severity="error",
        ))
    else:
        for i, step in enumerate(uc.main_flow):
            if not step.text or not step.text.strip():
                issues.append(ValidationIssue(
                    field=f"mainFlow[{i}]",
                    message=f"Krok č. {i + 1} nesmie byť prázdny",
                    severity="error",
                ))
            else:
                _check_ui_phrases(step.text, f"mainFlow[{i}]", issues)
                _check_actor_and_verb(step.text, f"mainFlow[{i}]", i + 1, all_actors, issues)

    if not uc.preconditions:
        issues.append(ValidationIssue(
            field="preconditions",
            message="Odporúča sa definovať aspoň jednu predpodmienku",
            severity="warning",
        ))

    if not uc.postconditions:
        issues.append(ValidationIssue(
            field="postconditions",
            message="Odporúča sa definovať aspoň jednu postpodmienku",
            severity="warning",
        ))

    main_step_ids = {step.id for step in uc.main_flow}

    for i, alt in enumerate(uc.alternative_flows):
        # Check for orphaned step reference
        if alt.triggered_by_step_id and alt.triggered_by_step_id not in main_step_ids:
            issues.append(ValidationIssue(
                field=f"alternativeFlows[{i}].triggeredByStepId",
                message=f"Spúšťací krok alternatívneho toku '{alt.label}' bol odstránený z hlavného toku",
                severity="error",
            ))

        if not alt.condition or not alt.condition.strip():
            issues.append(ValidationIssue(
                field=f"alternativeFlows[{i}].condition",
                message=f"Alternatívny tok '{alt.label}' musí mať definovanú podmienku/popis",
                severity="error",
            ))
        if not alt.steps:
            issues.append(ValidationIssue(
                field=f"alternativeFlows[{i}]",
                message=f"Alternatívny tok '{alt.label}' musí obsahovať aspoň jeden krok",
                severity="error",
            ))
        else:
            for j, step in enumerate(alt.steps):
                if not step.text or not step.text.strip():
                    issues.append(ValidationIssue(
                        field=f"alternativeFlows[{i}].steps[{j}]",
                        message=f"Krok č. {j + 1} v alternatívnom toku '{alt.label}' nesmie byť prázdny",
                        severity="error",
                    ))
                else:
                    _check_ui_phrases(step.text, f"alternativeFlows[{i}].steps[{j}]", issues)
                    _check_actor_and_verb(step.text, f"alternativeFlows[{i}].steps[{j}]", j + 1, all_actors, issues)

    return issues
