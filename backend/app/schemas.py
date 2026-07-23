from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RoomCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class RoomJoinRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)
    name: str = Field(min_length=1, max_length=64)


class PlaybackUpdateRequest(BaseModel):
    is_playing: bool | None = None
    current_time: int | None = Field(default=None, ge=0)
    movie_title: str | None = Field(default=None, min_length=1, max_length=128)


class ParticipantResponse(BaseModel):
    name: str
    is_host: bool
    joined_at: datetime


class PlaybackResponse(BaseModel):
    movie_title: str
    is_playing: bool
    current_time: int


class RoomResponse(BaseModel):
    code: str
    host_name: str
    created_at: datetime
    participants: list[ParticipantResponse]
    playback: PlaybackResponse
