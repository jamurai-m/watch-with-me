from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
from secrets import choice

from app.models import PlaybackState, Room, RoomParticipant


class RoomNotFoundError(Exception):
    pass


class RoomStore:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}

    def create_room(self, host_name: str) -> Room:
        code = self._generate_room_code()
        room = Room(code=code, host_name=host_name)
        room.participants.append(RoomParticipant(name=host_name, is_host=True))
        self._rooms[code] = room
        return room

    def join_room(self, code: str, name: str) -> Room:
        room = self.get_room(code)
        if not any(participant.name == name for participant in room.participants):
            room.participants.append(RoomParticipant(name=name, is_host=False))
        return room

    def get_room(self, code: str) -> Room:
        normalized_code = code.upper()
        room = self._rooms.get(normalized_code)
        if room is None:
            raise RoomNotFoundError(normalized_code)
        return room

    def update_playback(
        self,
        code: str,
        *,
        movie_title: str | None = None,
        source_url: str | None = None,
        is_playing: bool | None = None,
        current_time: float | None = None,
    ) -> Room:
        room = self.get_room(code)
        now = self._utc_now()
        self._sync_playback_clock(room.playback, now)

        if movie_title is not None:
            room.playback.movie_title = movie_title
        if source_url is not None:
            room.playback.source_url = source_url
        if is_playing is not None:
            room.playback.is_playing = is_playing
        if current_time is not None:
            room.playback.current_time = current_time

        room.playback.updated_at = now
        return room

    def serialize_room(self, room: Room) -> dict:
        return {
            "code": room.code,
            "host_name": room.host_name,
            "created_at": room.created_at,
            "participants": [asdict(participant) for participant in room.participants],
            "playback": self._serialize_playback(room.playback),
        }

    def _serialize_playback(self, playback: PlaybackState) -> dict:
        current_time = playback.current_time
        if playback.is_playing:
            current_time += (self._utc_now() - playback.updated_at).total_seconds()

        return {
            "movie_title": playback.movie_title,
            "source_url": playback.source_url,
            "is_playing": playback.is_playing,
            "current_time": max(0.0, current_time),
            "updated_at": playback.updated_at,
        }

    def _sync_playback_clock(self, playback: PlaybackState, now: datetime) -> None:
        if playback.is_playing:
            playback.current_time = max(0.0, playback.current_time + (now - playback.updated_at).total_seconds())

    def _utc_now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _generate_room_code(self) -> str:
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        while True:
            code = "".join(choice(alphabet) for _ in range(6))
            if code not in self._rooms:
                return code


room_store = RoomStore()
