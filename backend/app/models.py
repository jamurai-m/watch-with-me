from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class RoomParticipant:
    name: str
    is_host: bool = False
    joined_at: datetime = field(default_factory=utc_now)


@dataclass
class PlaybackState:
    movie_title: str = "The Matrix"
    is_playing: bool = False
    current_time: int = 0


@dataclass
class Room:
    code: str
    host_name: str
    created_at: datetime = field(default_factory=utc_now)
    participants: list[RoomParticipant] = field(default_factory=list)
    playback: PlaybackState = field(default_factory=PlaybackState)
