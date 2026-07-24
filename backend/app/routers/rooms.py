from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas import (
    PlaybackUpdateRequest,
    RoomCreateRequest,
    RoomJoinRequest,
    RoomResponse,
)
from app.services.room_service import RoomNotFoundError, room_store

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreateRequest) -> RoomResponse:
    room = room_store.create_room(payload.name.strip())
    return RoomResponse.model_validate(room_store.serialize_room(room))


@router.post("/join")
def join_room(payload: RoomJoinRequest) -> RoomResponse:
    try:
        room = room_store.join_room(payload.code, payload.name.strip())
    except RoomNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room {error.args[0]} not found") from error
    return RoomResponse.model_validate(room_store.serialize_room(room))


@router.get("/{code}")
def get_room(code: str) -> RoomResponse:
    try:
        room = room_store.get_room(code)
    except RoomNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room {error.args[0]} not found") from error
    return RoomResponse.model_validate(room_store.serialize_room(room))


@router.patch("/{code}/playback")
def update_playback(code: str, payload: PlaybackUpdateRequest) -> RoomResponse:
    try:
        room = room_store.update_playback(
            code,
            movie_title=payload.movie_title,
            source_url=payload.source_url,
            is_playing=payload.is_playing,
            current_time=payload.current_time,
        )
    except RoomNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Room {error.args[0]} not found") from error
    return RoomResponse.model_validate(room_store.serialize_room(room))
