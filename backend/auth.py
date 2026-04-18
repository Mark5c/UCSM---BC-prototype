from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import aiosqlite

from database import get_db

SECRET_KEY = "ucms-dev-secret-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(user_id: str, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "username": username, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> Optional[dict]:
    """Decode token without raising — returns payload or None."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: aiosqlite.Connection = Depends(get_db),
) -> dict:
    """Strict dependency — raises 401 if not authenticated."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Neplatný alebo chýbajúci token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise exc
    payload = decode_token(token)
    if not payload:
        raise exc
    user_id = payload.get("sub")
    if not user_id:
        raise exc
    async with db.execute(
        "SELECT id, username, email, created_at FROM users WHERE id=?", (user_id,)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise exc
    return {"id": row["id"], "username": row["username"], "email": row["email"], "created_at": row["created_at"]}


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: aiosqlite.Connection = Depends(get_db),
) -> Optional[dict]:
    """Optional dependency — returns None if not authenticated."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    async with db.execute(
        "SELECT id, username, email, created_at FROM users WHERE id=?", (user_id,)
    ) as cursor:
        row = await cursor.fetchone()
    if not row:
        return None
    return {"id": row["id"], "username": row["username"], "email": row["email"], "created_at": row["created_at"]}


async def assert_project_access(
    project_id: str,
    db: aiosqlite.Connection,
    current_user: dict,
    share_token: Optional[str] = None,
) -> dict:
    """Fetch project and verify the user has access. Returns the project row as dict."""
    async with db.execute("SELECT * FROM projects WHERE id=?", (project_id,)) as cursor:
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Projekt nebol nájdený")

    project = dict(row)
    visibility = project.get("visibility", "public")
    owner_id = project.get("owner_id")

    # Owner always has access
    if owner_id == current_user["id"]:
        return project

    if visibility == "public":
        return project

    if visibility == "link":
        if share_token and share_token == project.get("share_token"):
            return project
        raise HTTPException(status_code=403, detail="Nemáte prístup k tomuto projektu. Použite zdieľaný odkaz.")

    # private
    raise HTTPException(status_code=403, detail="Nemáte prístup k tomuto projektu")
