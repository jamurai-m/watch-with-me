# Backend

FastAPI backend for room creation, join flow, and room state.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health`
- `POST /rooms`
- `POST /rooms/join`
- `GET /rooms/{code}`
- `PATCH /rooms/{code}/playback`
