# My Awesome Dragon Boat 🐉

A 2-player local dragon boat racing game. MVP — keep it simple, have fun.

## Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Python 3.12 + FastAPI
- **Database**: PostgreSQL
- **Containerization**: Docker Compose

## How to Run

### With Docker (recommended)
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

### Without Docker (dev mode)

**Backend**
```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL env var pointing to a local Postgres instance
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## How to Play

1. Enter names for **Player 1** and **Player 2** on the Home page.
2. Click **Start Race** on the Game page.
3. Alternate your keys to paddle — you must alternate, same key twice does nothing!
   - Player 1: **A** and **D**
   - Player 2: **J** and **L**
4. First boat to reach the finish line wins!
5. Winner's time is saved to the leaderboard.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/users` | Register a player by name |
| POST | `/scores` | Submit a race score |
| GET  | `/leaderboard` | Get top 10 scores |
