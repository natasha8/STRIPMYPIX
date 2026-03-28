# StripMyPix

> **Your images are talking. Shut them up.**

Analyze image EXIF metadata for privacy leaks and strip it in one click.

## The Problem

Every photo carries invisible baggage — GPS coordinates, camera serial numbers, timestamps,
software fingerprints. Share an image and you might be sharing your home address.

## What StripMyPix Does

- **Detect** — Scans EXIF data for GPS, camera model, serial numbers, timestamps, software, lens info.
- **Score** — Rates your exposure from 0 (critical) to 100 (safe).
- **Strip** — Removes all metadata and returns a clean file. No data stored. No accounts. No tracking.

## Tech Stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4  |
| Backend  | Python 3.12, FastAPI, Pillow, piexif           |
| Map      | Leaflet + react-leaflet                        |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│        Next.js 16 · React 19 · Tailwind 4           │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ DropZone │→ │AnalysisDash  │  │ LocationMap  │  │
│  └──────────┘  │ PrivacyGauge │  │ (Leaflet)    │  │
│                │ MetadataGrid │  └──────────────┘  │
│                │ StripButton  │                     │
│                └──────────────┘                     │
└───────────────────────┬─────────────────────────────┘
                        │ POST /analyze
                        │ POST /strip
                        ▼
┌─────────────────────────────────────────────────────┐
│                     Backend                         │
│              FastAPI · Python 3.12                   │
│                                                     │
│  ┌─────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Routers │→ │   Services    │  │   Schemas    │  │
│  │ /analyze│  │ exif.py       │  │ Pydantic     │  │
│  │ /strip  │  │ validation.py │  │ models       │  │
│  └─────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

All processing is ephemeral. No database, no cloud storage, no accounts.

## Quickstart

### Backend

From the repo root, use a virtual environment so dependencies stay isolated (do not rely on a global `uvicorn` on `PATH`).

**macOS / Linux (bash):**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Windows (PowerShell):**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

If script execution is blocked, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or call the interpreter directly without activating:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and drop an image.

### Run Tests

```bash
cd backend
# With venv active, or: .\.venv\Scripts\python.exe -m pytest -v
python -m pytest -v
```

## Troubleshooting

### Windows: `WinError 10013` when starting uvicorn

Usually the chosen port is **already in use** (e.g. a previous `uvicorn` still running) or blocked by policy. Check listeners:

```powershell
netstat -ano | findstr ":8000"
```

Note the **PID** in the last column, then stop it (replace `12345`):

```powershell
taskkill /PID 12345 /F
```

Or use another port and point the frontend at it (`frontend/.env.local`):

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8080
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8080` in `frontend/.env.local`.

## Project Structure

```
StripMyPix/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app factory
│   │   ├── config.py          # pydantic-settings
│   │   ├── schemas.py         # response models
│   │   ├── routers/
│   │   │   ├── analyze.py     # POST /analyze
│   │   │   └── strip.py       # POST /strip
│   │   └── services/
│   │       ├── exif.py        # EXIF extraction, scoring, stripping
│   │       └── validation.py  # upload validation
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_exif_service.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── globals.css        # design tokens + animations
│   │   ├── layout.tsx         # root layout + header
│   │   ├── page.tsx           # home — drop zone + hero
│   │   └── analysis/
│   │       └── page.tsx       # analysis dashboard
│   ├── components/
│   │   ├── DropZone.tsx
│   │   ├── PrivacyGauge.tsx
│   │   ├── MetadataGrid.tsx
│   │   ├── StripButton.tsx
│   │   └── LocationMap.tsx
│   └── lib/
│       └── api.ts             # typed API client
├── .env.example
├── .gitignore
└── README.md
```

## License

MIT
