import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
import aiosqlite

from database import get_db
from models import UseCaseGroupCreate, UseCaseGroupUpdate, UseCaseGroupResponse
from auth import get_current_user, assert_project_access
from ws.manager import manager

router = APIRouter(prefix="/api/projects/{project_id}/groups", tags=["groups"])


def _row_to_group(row: aiosqlite.Row) -> UseCaseGroupResponse:
    return UseCaseGroupResponse(
        id=row["id"],
        project_id=row["project_id"],
        name=row["name"],
        position=row["position"],
    )


@router.get("", response_model=List[UseCaseGroupResponse])
async def list_groups(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT * FROM use_case_groups WHERE project_id=? ORDER BY position ASC, rowid ASC",
        (project_id,),
    ) as cursor:
        rows = await cursor.fetchall()
    return [_row_to_group(r) for r in rows]


@router.post("", response_model=UseCaseGroupResponse, status_code=201)
async def create_group(
    project_id: str,
    body: UseCaseGroupCreate,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    group_id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO use_case_groups (id, project_id, name, position) VALUES (?,?,?,?)",
        (group_id, project_id, body.name, body.position),
    )
    await db.commit()
    async with db.execute("SELECT * FROM use_case_groups WHERE id=?", (group_id,)) as cursor:
        row = await cursor.fetchone()
    group = _row_to_group(row)
    now = datetime.now(timezone.utc).isoformat()
    await manager.broadcast(project_id, {
        "type": "group_created",
        "payload": group.model_dump(),
        "version": 0,
        "updated_by": current_user["username"],
        "timestamp": now,
    })
    return group


@router.put("/{group_id}", response_model=UseCaseGroupResponse)
async def update_group(
    project_id: str,
    group_id: str,
    body: UseCaseGroupUpdate,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT id FROM use_case_groups WHERE id=? AND project_id=?", (group_id, project_id)
    ) as cursor:
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Skupina nebola najdena")
    await db.execute(
        "UPDATE use_case_groups SET name=?, position=? WHERE id=?",
        (body.name, body.position, group_id),
    )
    await db.commit()
    async with db.execute("SELECT * FROM use_case_groups WHERE id=?", (group_id,)) as cursor:
        row = await cursor.fetchone()
    group = _row_to_group(row)
    now = datetime.now(timezone.utc).isoformat()
    await manager.broadcast(project_id, {
        "type": "group_updated",
        "payload": group.model_dump(),
        "version": 0,
        "updated_by": current_user["username"],
        "timestamp": now,
    })
    return group


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    project_id: str,
    group_id: str,
    current_user: dict = Depends(get_current_user),
    x_share_token: Optional[str] = Header(default=None),
    db: aiosqlite.Connection = Depends(get_db),
):
    await assert_project_access(project_id, db, current_user, x_share_token)
    async with db.execute(
        "SELECT id FROM use_case_groups WHERE id=? AND project_id=?", (group_id, project_id)
    ) as cursor:
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Skupina nebola najdena")
    # Unassign all UCs in this group
    await db.execute(
        "UPDATE use_cases SET group_id=NULL WHERE group_id=? AND project_id=?",
        (group_id, project_id),
    )
    await db.execute(
        "DELETE FROM use_case_groups WHERE id=? AND project_id=?", (group_id, project_id)
    )
    await db.commit()
    now = datetime.now(timezone.utc).isoformat()
    await manager.broadcast(project_id, {
        "type": "group_deleted",
        "payload": {"id": group_id},
        "version": 0,
        "updated_by": current_user["username"],
        "timestamp": now,
    })
