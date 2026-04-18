from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import projects, use_cases, relationships, groups
from routers import auth as auth_router
from ws.manager import manager
from auth import decode_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="UCMS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Share-Token"],
)

app.include_router(auth_router.router)
app.include_router(projects.router)
app.include_router(use_cases.router)
app.include_router(relationships.router)
app.include_router(groups.router)


@app.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: str,
    client_id: str = Query(default="anonymous"),
    token: str = Query(default=None),
):
    if token:
        payload = decode_token(token)
        if payload and payload.get("username"):
            client_id = payload["username"]

    await manager.connect(websocket, project_id, client_id)
    now = datetime.now(timezone.utc).isoformat()

    await manager.broadcast(project_id, {
        "type": "user_joined",
        "payload": {"client_id": client_id},
        "version": 0,
        "updated_by": client_id,
        "timestamp": now,
    }, exclude=websocket)

    await manager.send_personal(websocket, {
        "type": "connected",
        "payload": {
            "client_id": client_id,
            "project_id": project_id,
            "users_in_room": manager.get_client_count(project_id),
        },
        "version": 0,
        "updated_by": "server",
        "timestamp": now,
    })

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
        now = datetime.now(timezone.utc).isoformat()
        await manager.broadcast(project_id, {
            "type": "user_left",
            "payload": {"client_id": client_id},
            "version": 0,
            "updated_by": client_id,
            "timestamp": now,
        })


@app.get("/api/health")
async def health():
    return {"status": "ok"}
