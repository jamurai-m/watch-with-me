export type ParticipantResponse = {
  name: string;
  is_host: boolean;
  joined_at: string;
};

export type PlaybackResponse = {
  movie_title: string;
  source_url: string;
  is_playing: boolean;
  current_time: number;
  updated_at: string;
};

export type RoomResponse = {
  code: string;
  host_name: string;
  created_at: string;
  participants: ParticipantResponse[];
  playback: PlaybackResponse;
};

type ApiErrorPayload = {
  detail?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ? init.headers : {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload.detail) {
        errorMessage = payload.detail;
      }
    } catch {
      // Ignore JSON parsing failures and use fallback message.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export function createRoom(name: string): Promise<RoomResponse> {
  return request<RoomResponse>('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function joinRoom(code: string, name: string): Promise<RoomResponse> {
  return request<RoomResponse>('/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ code, name }),
  });
}

export function getRoom(code: string): Promise<RoomResponse> {
  return request<RoomResponse>(`/rooms/${encodeURIComponent(code)}`);
}

type UpdatePlaybackPayload = {
  movie_title?: string;
  source_url?: string;
  is_playing?: boolean;
  current_time?: number;
};

export function updatePlayback(code: string, payload: UpdatePlaybackPayload): Promise<RoomResponse> {
  return request<RoomResponse>(`/rooms/${encodeURIComponent(code)}/playback`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}