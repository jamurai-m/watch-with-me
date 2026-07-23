from __future__ import annotations

from dataclasses import asdict
from secrets import choice

from app.models import Room, RoomParticipant


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
        is_playing: bool | None = None,
        current_time: int | None = None,
    ) -> Room:
        room = self.get_room(code)
        if movie_title is not None:
            room.playback.movie_title = movie_title
        if is_playing is not None:
            room.playback.is_playing = is_playing
        if current_time is not None:
            room.playback.current_time = current_time
        return room

    def serialize_room(self, room: Room) -> dict:
        return {
            "code": room.code,
            "host_name": room.host_name,
            "created_at": room.created_at,
            "participants": [asdict(participant) for participant in room.participants],
            "playback": asdict(room.playback),
        }

    def _generate_room_code(self) -> str:
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        while True:
            code = "".join(choice(alphabet) for _ in range(6))
            if code not in self._rooms:
                return code


room_store = RoomStore()
