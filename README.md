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

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
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
python -m pytest -v
```

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
