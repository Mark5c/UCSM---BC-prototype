import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
import aiosqlite

from database import get_db
from models import UserCreate, UserLogin, UserResponse, TokenResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserCreate, db: aiosqlite.Connection = Depends(get_db)):
    # Check uniqueness
    async with db.execute("SELECT id FROM users WHERE username=? OR email=?", (body.username, body.email)) as cursor:
        if await cursor.fetchone():
            raise HTTPException(status_code=409, detail="Používateľské meno alebo email už existuje")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?,?,?,?,?)",
        (user_id, body.username, body.email, hash_password(body.password), now),
    )
    await db.commit()

    token = create_access_token(user_id, body.username)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(id=user_id, username=body.username, email=body.email, created_at=now),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT id, username, email, password_hash, created_at FROM users WHERE username=?",
        (body.username,),
    ) as cursor:
        row = await cursor.fetchone()

    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nesprávne prihlasovacie meno alebo heslo",
        )

    token = create_access_token(row["id"], row["username"])
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(id=row["id"], username=row["username"], email=row["email"], created_at=row["created_at"]),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)
