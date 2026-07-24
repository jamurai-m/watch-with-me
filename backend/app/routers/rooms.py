from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status

from app.schemas import (
    PlaybackUpdateRequest,
    RoomCreateRequest,
    RoomJoinRequest,
    RoomResponse,
)
from app.services.room_events import room_event_hub
from app.services.room_service import RoomNotFoundError, room_store

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_room(payload: RoomCreateRequest) -> RoomResponse:
    room = room_store.create_room(payload.name.strip())
    response = RoomResponse.model_validate(room_store.serialize_room(room))
    await room_event_hub.broadcast_room(room, {"type": "room_state", "room": response.model_dump(mode="json")})
    return response


@router.post("/join")
async def join_room(payload: RoomJoinRequest) -> RoomResponse:
    try:
        room = room_store.join_room(payload.code, payload.name.strip())
    except RoomNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room {error.args[0]} not found") from error
    response = RoomResponse.model_validate(room_store.serialize_room(room))
    await room_event_hub.broadcast_room(room, {"type": "room_state", "room": response.model_dump(mode="json")})
    return response


@router.get("/{code}")
def get_room(code: str) -> RoomResponse:
    try:
        room = room_store.get_room(code)
    except RoomNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room {error.args[0]} not found") from error
    return RoomResponse.model_validate(room_store.serialize_room(room))


@router.patch("/{code}/playback")
async def update_playback(code: str, payload: PlaybackUpdateRequest) -> RoomResponse:
    try:
        room = room_store.update_playback(
            code,
            source_url=payload.source_url,
            is_playing=payload.is_playing,
            current_time=payload.current_time,
        )
    except RoomNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room {error.args[0]} not found") from error
    response = RoomResponse.model_validate(room_store.serialize_room(room))
    await room_event_hub.broadcast_room(room, {"type": "room_state", "room": response.model_dump(mode="json")})
    return response


@router.websocket("/{code}/events")
async def room_events(code: str, websocket: WebSocket) -> None:
    try:
        room = room_store.get_room(code)
    except RoomNotFoundError:
        await websocket.close(code=1008)
        return

    await room_event_hub.connect(room.code, websocket)
    await websocket.send_json({"type": "room_state", "room": RoomResponse.model_validate(room_store.serialize_room(room)).model_dump(mode="json")})

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        room_event_hub.disconnect(room.code, websocket)
