from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING

from fastapi import WebSocket

if TYPE_CHECKING:
    from app.models import Room


class RoomEventHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room_code: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[room_code].add(websocket)

    def disconnect(self, room_code: str, websocket: WebSocket) -> None:
        room_connections = self._connections.get(room_code)
        if not room_connections:
            return

        room_connections.discard(websocket)
        if not room_connections:
            self._connections.pop(room_code, None)

    async def broadcast_room(self, room: "Room", payload: dict) -> None:
        room_connections = list(self._connections.get(room.code, set()))
        if not room_connections:
            return

        stale_connections: list[WebSocket] = []
        for websocket in room_connections:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            self.disconnect(room.code, websocket)


room_event_hub = RoomEventHub()