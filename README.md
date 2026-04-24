# MyMane

Property deal management platform with a React frontend, FastAPI backend, SQLite persistence, and a Puppeteer PDF generation service.

## Structure

```text
frontend/     React + Vite admin dashboard
backend/      FastAPI API, uploads, SQLite access
pdf-service/  Express + Puppeteer PDF renderer
```

## Backend

1. Create a Python virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env` and update values.
4. Run the API with `uvicorn backend.main:app --reload --port 8000`.

The backend reads its environment from `backend/.env` and creates `backend/propdeal.db` automatically by default.

## Frontend

1. Install dependencies with `npm install`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Run with `npm run dev`.

Authentication is currently removed, so the frontend opens directly to the dashboard.

## PDF Service

1. Install dependencies with `npm install`.
2. Start with `npm run dev`.

The PDF service saves generated files into `backend/uploads/properties/{property_id}/deal_document.pdf`.
