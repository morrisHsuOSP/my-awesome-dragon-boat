# Local Development Guide

This guide explains how to run the project locally for development and testing on **Windows** (PowerShell).

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.12+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Docker & Docker Compose | v2 plugin | `docker compose version` |

---

## 1. Environment Variables

Copy the example file and fill in your GitHub token:

```powershell
Copy-Item .env.example .env
# Edit .env and set GITHUB_TOKEN
```

The `.env` file is git-ignored and will be loaded automatically by Docker Compose.

For local (non-Docker) backend, set the variables in your terminal session:

```powershell
$env:DATABASE_URL = "postgresql://dragon:dragon@localhost:5432/dragonboat"
$env:GITHUB_TOKEN = "ghp_your-token-here"
```

---

## 2. Start the Database

Use Docker to run **only** the PostgreSQL database with port 5432 exposed:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d
```

Verify the database is running:

```powershell
docker compose ps
```

### Connect to the Database (psql)

```powershell
docker compose exec db psql -U dragon -d dragonboat
```

Useful psql commands:

```sql
-- List all tables
\dt

-- View co-op results
SELECT * FROM co_op_results;

-- View users
SELECT * FROM users;

-- Count records
SELECT COUNT(*) FROM co_op_results;
```

Type `\q` to exit psql.

---

## 3. Start the Backend (Local)

```powershell
cd backend

# Create virtual environment (first time only)
python -m venv ..\.venv

# Activate virtual environment
..\.venv\Scripts\Activate.ps1

# Install dependencies (first time or after requirements.txt changes)
pip install -r requirements.txt

# Set environment variables
$env:DATABASE_URL = "postgresql://dragon:dragon@localhost:5432/dragonboat"
$env:GITHUB_TOKEN = "ghp_your-token-here"

# Start the backend with auto-reload
uvicorn main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**.

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 4. Start the Frontend (Local)

Open a **new terminal**:

```powershell
cd frontend

# Install dependencies (first time or after package.json changes)
npm install

# Start Vite dev server
npm run dev
```

The frontend will be available at **http://localhost:3000**.

> The Vite dev server is configured to proxy `/api/*` requests to `http://localhost:8000`, so the frontend can reach the backend without CORS issues.

---

## 5. Full-Stack via Docker (Alternative)

If you prefer to run everything in Docker:

```powershell
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs

---

## Database Management

### Reset a Specific Table

Connect to psql and run:

```sql
-- Delete all co-op results
TRUNCATE TABLE co_op_results RESTART IDENTITY CASCADE;

-- Delete all users (this also cascades to scores and co_op_results)
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Delete all data from all tables
TRUNCATE TABLE users, scores, co_op_results, typing_scores RESTART IDENTITY CASCADE;
```

### Reset the Entire Database (Drop & Recreate)

```powershell
# Stop all services
docker compose down

# Remove the database volume (destroys all data)
docker compose down -v

# Restart — tables will be auto-created by SQLAlchemy on backend startup
docker compose -f docker-compose.yml -f docker-compose.dev.yml up db -d
```

Then restart the backend (local or Docker) — `models.Base.metadata.create_all()` in `main.py` will recreate all tables.

### Backup & Restore

```powershell
# Backup
docker compose exec db pg_dump -U dragon dragonboat > backup.sql

# Restore (after resetting)
Get-Content backup.sql | docker compose exec -T db psql -U dragon dragonboat
```

---

## Testing the Co-op Analyze API

```powershell
# Quick test with curl (PowerShell)
Invoke-RestMethod -Uri http://localhost:8000/api/co-op-challenge/analyze `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"p1_name":"Alice","p2_name":"Bob","duration_ms":5000,"p1_timestamps":[0,500,1100,1800],"p2_timestamps":[250,800,1450,2100]}'
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `psycopg2` install fails on Windows | Use `pip install psycopg2-binary` (already in requirements.txt) |
| Port 5432 already in use | Stop any local PostgreSQL service or change the port mapping in `docker-compose.dev.yml` |
| Port 8000 already in use | Kill the process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess \| Stop-Process` |
| `GITHUB_TOKEN` not set | The `/analyze` endpoint returns HTTP 502 with an error message because AI authentication fails. |
| AI rate limit | You may have exceeded your GitHub Models quota/rate limit. |
| `co_op_results` table missing columns after model changes | Reset the DB with `docker compose down -v` and restart |
