import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
import aiosqlite

from database import get_db
from models import RelationshipCreate, RelationshipResponse
from auth import get_current_user, assert_project_access

router = APIRouter(prefix="/api/projects/{project_id}/relationships", tags=["relationships"])


def _row_to_rel(row: aiosqlite.Row) -> RelationshipResponse:
    return RelationshipResponse(
        id=row["id"],
        project_id=row["project_id"],
        source_id=row["source_id"],
        target_id=row["target_id"],
        type=row["type"],
        note=row["note"],
    )


async def _log_history(
    db: aiosqlite.Connection,
    project_id: str,
    user: dict,
    action: str,
    target_name: str,
    source_id: Optional[str] = None,
    rel_id: Optional[str] = None,
):
    now = datetime.now(timezone.utc).isoformat()
    # Store rel_id in changed_fields so the frontend can identify + highlight the relationship
    changed_json = json.dumps([rel_id]) if rel_id else None
    await db.execute(
        """INSERT INTO change_history
           (id, project_id, use_case_id, user_id, username, action, target_type, target_name, timestamp, changed_fields)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (str(uuid.uuid4()), project_id, source_id, user["id"], user["username"],
         action, "relationship", target_name, now, changed_json),
    )


@router.get("", response_model=List[RelationshipResponse])
async def list_relationships(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT * FROM relationships WHERE project_id=?", (project_id,)
    ) as cursor:
        rows = await cursor.fetchall()
    return [_row_to_rel(r) for r in rows]


@router.post("", response_model=RelationshipResponse, status_code=201)
async def create_relationship(
    project_id: str,
    body: RelationshipCreate,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)

    src_name, tgt_name = body.source_id, body.target_id
    for uc_id in (body.source_id, body.target_id):
        async with db.execute(
            "SELECT id, name FROM use_cases WHERE id=? AND project_id=?", (uc_id, project_id)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404,
                    detail=f"Pripad pouzitia {uc_id} nebol najdeny v tomto projekte",
                )
            if uc_id == body.source_id:
                src_name = row["name"]
            else:
                tgt_name = row["name"]

    rel_id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO relationships (id, project_id, source_id, target_id, type, note) VALUES (?,?,?,?,?,?)",
        (rel_id, project_id, body.source_id, body.target_id, body.type, body.note),
    )
    target_name = f"{src_name} → {tgt_name}"
    await _log_history(db, project_id, current_user, "created", target_name, body.source_id, rel_id)
    await db.commit()

    async with db.execute("SELECT * FROM relationships WHERE id=?", (rel_id,)) as cursor:
        row = await cursor.fetchone()
    return _row_to_rel(row)


@router.delete("/{rel_id}", status_code=204)
async def delete_relationship(
    project_id: str,
    rel_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)

    async with db.execute(
        "SELECT r.id, r.source_id, r.target_id, r.type, s.name AS src_name, t.name AS tgt_name "
        "FROM relationships r "
        "LEFT JOIN use_cases s ON s.id = r.source_id "
        "LEFT JOIN use_cases t ON t.id = r.target_id "
        "WHERE r.id=? AND r.project_id=?", (rel_id, project_id)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Vztah nebol najdeny")

    src_name = row["src_name"] or row["source_id"]
    tgt_name = row["tgt_name"] or row["target_id"]
    target_name = f"{src_name} → {tgt_name}"

    await db.execute(
        "DELETE FROM relationships WHERE id=? AND project_id=?", (rel_id, project_id)
    )
    await _log_history(db, project_id, current_user, "deleted", target_name, row["source_id"], rel_id)
    await db.commit()
