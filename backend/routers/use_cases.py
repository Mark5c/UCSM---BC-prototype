import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
import aiosqlite

from database import get_db
from models import UseCaseCreate, UseCaseUpdate, UseCaseResponse, UseCaseMoveGroup, ValidationResult
from validation import validate_use_case
from ws.manager import manager
from auth import get_current_user, assert_project_access

router = APIRouter(prefix="/api/projects/{project_id}/use-cases", tags=["use-cases"])


def _row_to_uc(row: aiosqlite.Row) -> UseCaseResponse:
    return UseCaseResponse(
        id=row["id"],
        project_id=row["project_id"],
        name=row["name"],
        template_type=row["template_type"],
        primary_actor=row["primary_actor"],
        supporting_actors=json.loads(row["supporting_actors"]) if row["supporting_actors"] else [],
        goal=row["goal"],
        preconditions=json.loads(row["preconditions"]),
        postconditions=json.loads(row["postconditions"]),
        main_flow=json.loads(row["main_flow"]),
        alternative_flows=json.loads(row["alternative_flows"]),
        template_extras=json.loads(row["template_extras"]),
        version=row["version"],
        updated_at=row["updated_at"],
        updated_by=row["updated_by"],
        group_id=row["group_id"],
    )


def _compute_changed_fields(old_row: aiosqlite.Row, body) -> list[str]:
    changed = []
    simple = [
        ('name', old_row['name'], body.name),
        ('primary_actor', old_row['primary_actor'], body.primary_actor),
        ('goal', old_row['goal'], body.goal),
    ]
    for field, old_val, new_val in simple:
        if old_val != new_val:
            changed.append(field)
    json_list_fields = [
        ('supporting_actors', old_row['supporting_actors'], body.supporting_actors),
        ('preconditions', old_row['preconditions'], body.preconditions),
        ('postconditions', old_row['postconditions'], body.postconditions),
    ]
    for field, old_raw, new_val in json_list_fields:
        try:
            old_val = json.loads(old_raw) if isinstance(old_raw, str) else old_raw
        except Exception:
            old_val = old_raw
        if old_val != new_val:
            changed.append(field)

    # Granular template_extras: emit template_extras.<key> for each changed key
    try:
        old_extras = json.loads(old_row['template_extras']) if isinstance(old_row['template_extras'], str) else (old_row['template_extras'] or {})
    except Exception:
        old_extras = {}
    new_extras = body.template_extras or {}
    for key in set(list(old_extras.keys()) + list(new_extras.keys())):
        if old_extras.get(key) != new_extras.get(key):
            changed.append(f'template_extras.{key}')

    # Granular main_flow: emit main_flow.<step_id> for each new/changed/deleted step
    try:
        old_steps = {s['id']: s for s in (json.loads(old_row['main_flow']) if isinstance(old_row['main_flow'], str) else [])}
    except Exception:
        old_steps = {}
    new_steps = {s.id: s.model_dump() for s in body.main_flow}
    for sid in set(old_steps) | set(new_steps):
        if old_steps.get(sid) != new_steps.get(sid):
            changed.append(f'main_flow.{sid}')

    # Granular alternative_flows: emit alternative_flows.<af_id> for each changed AF
    try:
        old_afs = {af['id']: af for af in (json.loads(old_row['alternative_flows']) if isinstance(old_row['alternative_flows'], str) else [])}
    except Exception:
        old_afs = {}
    new_afs = {af.id: af.model_dump() for af in body.alternative_flows}
    for afid in set(old_afs) | set(new_afs):
        if old_afs.get(afid) != new_afs.get(afid):
            changed.append(f'alternative_flows.{afid}')

    return changed


async def _log_history(
    db: aiosqlite.Connection,
    project_id: str,
    user: dict,
    action: str,
    target_name: str,
    use_case_id: Optional[str] = None,
    changed_fields: Optional[list] = None,
):
    now = datetime.now(timezone.utc).isoformat()
    changed_json = json.dumps(changed_fields) if changed_fields else None

    # For updates: coalesce rapid consecutive edits by the same user into one entry
    if action == "updated" and use_case_id:
        cutoff = (datetime.now(timezone.utc) - timedelta(seconds=60)).isoformat()
        async with db.execute(
            """SELECT id, changed_fields FROM change_history
               WHERE project_id=? AND use_case_id=? AND user_id=? AND action='updated'
               AND timestamp > ? ORDER BY timestamp DESC LIMIT 1""",
            (project_id, use_case_id, user["id"], cutoff),
        ) as cursor:
            recent = await cursor.fetchone()
        if recent:
            # Merge changed fields from previous and current save
            try:
                prev_fields = set(json.loads(recent["changed_fields"] or "[]"))
            except Exception:
                prev_fields = set()
            merged = json.dumps(sorted(prev_fields | set(changed_fields or [])))
            await db.execute(
                "UPDATE change_history SET timestamp=?, target_name=?, changed_fields=? WHERE id=?",
                (now, target_name, merged, recent["id"]),
            )
            return

    await db.execute(
        """INSERT INTO change_history
           (id, project_id, use_case_id, user_id, username, action, target_type, target_name, timestamp, changed_fields)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (str(uuid.uuid4()), project_id, use_case_id, user["id"], user["username"],
         action, "use_case", target_name, now, changed_json),
    )


@router.get("", response_model=List[UseCaseResponse])
async def list_use_cases(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT * FROM use_cases WHERE project_id=? ORDER BY name", (project_id,)
    ) as cursor:
        rows = await cursor.fetchall()
    return [_row_to_uc(r) for r in rows]


@router.post("", response_model=UseCaseResponse, status_code=201)
async def create_use_case(
    project_id: str,
    body: UseCaseCreate,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    now = datetime.now(timezone.utc).isoformat()
    uc_id = str(uuid.uuid4())
    username = current_user["username"]

    await db.execute(
        """INSERT INTO use_cases
           (id, project_id, name, template_type, primary_actor, supporting_actors, goal,
            preconditions, postconditions, main_flow, alternative_flows,
            template_extras, version, updated_at, updated_by, group_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            uc_id, project_id, body.name, body.template_type,
            body.primary_actor, json.dumps(body.supporting_actors), body.goal,
            json.dumps([p for p in body.preconditions]),
            json.dumps([p for p in body.postconditions]),
            json.dumps([s.model_dump() for s in body.main_flow]),
            json.dumps([af.model_dump() for af in body.alternative_flows]),
            json.dumps(body.template_extras),
            1, now, username, body.group_id,
        ),
    )
    await _log_history(db, project_id, current_user, "created", body.name, uc_id)
    await db.commit()

    async with db.execute("SELECT * FROM use_cases WHERE id=?", (uc_id,)) as cursor:
        row = await cursor.fetchone()
    uc = _row_to_uc(row)

    await manager.broadcast(project_id, {
        "type": "use_case_created",
        "payload": uc.model_dump(),
        "version": uc.version,
        "updated_by": username,
        "timestamp": now,
    })
    return uc


@router.get("/{uc_id}", response_model=UseCaseResponse)
async def get_use_case(
    project_id: str,
    uc_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT * FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pripad pouzitia nebol najdeny")
    return _row_to_uc(row)


@router.put("/{uc_id}", response_model=UseCaseResponse)
async def update_use_case(
    project_id: str,
    uc_id: str,
    body: UseCaseUpdate,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)

    async with db.execute(
        "SELECT * FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pripad pouzitia nebol najdeny")

    stored_version = row["version"]
    changed_fields = _compute_changed_fields(row, body)
    if body.version < stored_version:
        raise HTTPException(
            status_code=409,
            detail=f"Konflikt verzie: ulozena {stored_version}, prijata {body.version}",
        )

    now = datetime.now(timezone.utc).isoformat()
    new_version = stored_version + 1
    username = current_user["username"]

    await db.execute(
        """UPDATE use_cases SET
           name=?, template_type=?, primary_actor=?, supporting_actors=?, goal=?,
           preconditions=?, postconditions=?, main_flow=?,
           alternative_flows=?, template_extras=?,
           version=?, updated_at=?, updated_by=?
           WHERE id=? AND project_id=?""",
        (
            body.name, body.template_type, body.primary_actor,
            json.dumps(body.supporting_actors), body.goal,
            json.dumps([p for p in body.preconditions]),
            json.dumps([p for p in body.postconditions]),
            json.dumps([s.model_dump() for s in body.main_flow]),
            json.dumps([af.model_dump() for af in body.alternative_flows]),
            json.dumps(body.template_extras),
            new_version, now, username,
            uc_id, project_id,
        ),
    )
    await _log_history(db, project_id, current_user, "updated", body.name, uc_id, changed_fields)
    await db.commit()

    async with db.execute("SELECT * FROM use_cases WHERE id=?", (uc_id,)) as cursor:
        row = await cursor.fetchone()
    uc = _row_to_uc(row)

    await manager.broadcast(project_id, {
        "type": "use_case_updated",
        "payload": uc.model_dump(),
        "version": uc.version,
        "updated_by": username,
        "timestamp": now,
    })
    return uc


@router.delete("/{uc_id}", status_code=204)
async def delete_use_case(
    project_id: str,
    uc_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    await db.execute("PRAGMA foreign_keys = ON")

    async with db.execute(
        "SELECT id, name FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pripad pouzitia nebol najdeny")

    uc_name = row["name"]
    await db.execute("DELETE FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id))
    await _log_history(db, project_id, current_user, "deleted", uc_name, uc_id)
    await db.commit()

    now = datetime.now(timezone.utc).isoformat()
    await manager.broadcast(project_id, {
        "type": "use_case_deleted",
        "payload": {"id": uc_id},
        "version": 0,
        "updated_by": current_user["username"],
        "timestamp": now,
    })


@router.patch("/{uc_id}/group", status_code=200)
async def move_use_case_group(
    project_id: str,
    uc_id: str,
    body: UseCaseMoveGroup,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT id FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id)
    ) as cursor:
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Pripad pouzitia nebol najdeny")
    await db.execute(
        "UPDATE use_cases SET group_id=? WHERE id=? AND project_id=?",
        (body.group_id, uc_id, project_id),
    )
    await db.commit()
    now = datetime.now(timezone.utc).isoformat()
    await manager.broadcast(project_id, {
        "type": "use_case_moved",
        "payload": {"id": uc_id, "group_id": body.group_id},
        "version": 0,
        "updated_by": current_user["username"],
        "timestamp": now,
    })
    return {"id": uc_id, "group_id": body.group_id}


@router.post("/{uc_id}/validate", response_model=ValidationResult)
async def validate(
    project_id: str,
    uc_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT * FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pripad pouzitia nebol najdeny")
    uc = _row_to_uc(row)
    issues = validate_use_case(uc)
    return ValidationResult(issues=issues)
