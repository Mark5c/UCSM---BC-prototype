import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # project_id -> set of (websocket, client_id) tuples
        self.rooms: Dict[str, Set[tuple]] = {}

    async def connect(self, websocket: WebSocket, project_id: str, client_id: str):
        await websocket.accept()
        if project_id not in self.rooms:
            self.rooms[project_id] = set()
        self.rooms[project_id].add((websocket, client_id))

    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.rooms:
            self.rooms[project_id] = {
                (ws, cid) for ws, cid in self.rooms[project_id] if ws is not websocket
            }

    def get_client_count(self, project_id: str) -> int:
        return len(self.rooms.get(project_id, set()))

    async def broadcast(self, project_id: str, event: dict, exclude: WebSocket = None):
        dead = set()
        for ws, cid in list(self.rooms.get(project_id, set())):
            if ws is exclude:
                continue
            try:
                await ws.send_json(event)
            except Exception:
                # Send failed — connection dropped without a clean close frame
                dead.add((ws, cid))
        # Remove dead connections so broadcast doesn't keep trying them
        if dead and project_id in self.rooms:
            self.rooms[project_id] -= dead

    async def send_personal(self, websocket: WebSocket, event: dict):
        try:
            await websocket.send_json(event)
        except Exception:
            pass


manager = ConnectionManager()
