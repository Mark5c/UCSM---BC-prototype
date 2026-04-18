import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
import aiosqlite

from database import get_db
from models import ProjectCreate, ProjectResponse, HistoryEntryResponse
from auth import get_current_user, assert_project_access

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _row_to_project(row: aiosqlite.Row) -> ProjectResponse:
    return ProjectResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        owner_id=row["owner_id"],
        visibility=row["visibility"],
        share_token=row["share_token"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def _log_history(
    db: aiosqlite.Connection,
    project_id: str,
    user: dict,
    action: str,
    target_type: str,
    target_name: Optional[str] = None,
    use_case_id: Optional[str] = None,
):
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        """INSERT INTO change_history
           (id, project_id, use_case_id, user_id, username, action, target_type, target_name, timestamp)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (str(uuid.uuid4()), project_id, use_case_id, user["id"], user["username"],
         action, target_type, target_name, now),
    )


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        """SELECT * FROM projects
           WHERE owner_id=? OR visibility='public'
           ORDER BY updated_at DESC""",
        (current_user["id"],),
    ) as cursor:
        rows = await cursor.fetchall()
    return [_row_to_project(r) for r in rows]


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    now = datetime.now(timezone.utc).isoformat()
    project_id = str(uuid.uuid4())
    share_token = str(uuid.uuid4()) if body.visibility == "link" else None

    await db.execute(
        """INSERT INTO projects (id, name, description, owner_id, visibility, share_token, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (project_id, body.name, body.description, current_user["id"],
         body.visibility, share_token, now, now),
    )
    await _log_history(db, project_id, current_user, "created", "project", body.name)
    await db.commit()

    async with db.execute("SELECT * FROM projects WHERE id=?", (project_id,)) as cursor:
        row = await cursor.fetchone()
    return _row_to_project(row)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute("SELECT * FROM projects WHERE id=?", (project_id,)) as cursor:
        row = await cursor.fetchone()
    return _row_to_project(row)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    project = await assert_project_access(project_id, db, current_user, x_share_token)

    now = datetime.now(timezone.utc).isoformat()
    share_token = project.get("share_token")
    if body.visibility == "link" and not share_token:
        share_token = str(uuid.uuid4())
    elif body.visibility != "link":
        share_token = None

    await db.execute(
        """UPDATE projects SET name=?, description=?, visibility=?, share_token=?, updated_at=?
           WHERE id=?""",
        (body.name, body.description, body.visibility, share_token, now, project_id),
    )
    await db.commit()

    async with db.execute("SELECT * FROM projects WHERE id=?", (project_id,)) as cursor:
        row = await cursor.fetchone()
    return _row_to_project(row)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    project = await assert_project_access(project_id, db, current_user, x_share_token)
    if project["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Len vlastnik moze odstranit projekt")

    await db.execute("PRAGMA foreign_keys = ON")
    await db.execute("DELETE FROM projects WHERE id=?", (project_id,))
    await db.commit()


@router.get("/{project_id}/history", response_model=List[HistoryEntryResponse])
async def get_history(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT * FROM change_history WHERE project_id=? ORDER BY timestamp DESC LIMIT 100",
        (project_id,),
    ) as cursor:
        rows = await cursor.fetchall()
    import json as _json
    def _parse_fields(raw):
        try:
            return _json.loads(raw) if raw else None
        except Exception:
            return None

    return [HistoryEntryResponse(
        id=r["id"], project_id=r["project_id"], use_case_id=r["use_case_id"],
        user_id=r["user_id"], username=r["username"], action=r["action"],
        target_type=r["target_type"], target_name=r["target_name"], timestamp=r["timestamp"],
        changed_fields=_parse_fields(r["changed_fields"]),
    ) for r in rows]
