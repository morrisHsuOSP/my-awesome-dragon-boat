# My Awesome Dragon Boat

Game hub architecture with multiple game modules.
Current games:
- Dragon Boat Race (fully playable)
- Speed Typing Challenge (frontend + backend scaffold)

## Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Python 3.12 + FastAPI
- **Database**: PostgreSQL
- **Containerization**: Docker Compose

## Project Structure

### Frontend
- `src/pages/HomePage.tsx`: Game hub home page (`Your Game Awaits`)
- `src/games/dragonBoat/*`: Dragon Boat Race pages and API
- `src/games/speedTyping/*`: Speed Typing Challenge pages and API scaffold
- `public/games/dragon-boat/game.js`: Dragon Boat gameplay script
- `public/games/dragon-boat/assets/boat.png`: Dragon Boat image asset

### Backend
- `main.py`: FastAPI app entrypoint and game router registration
- `games/dragon_boat/*`: Dragon Boat Race API router, schemas, service
- `games/speed_typing/*`: Speed Typing Challenge API router, schemas, service
- `models.py`: Shared SQLAlchemy models for all games

## How to Run

### With Docker (recommended)
```powershell
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

### Without Docker (dev mode)

**Backend**
```powershell
cd backend
pip install -r requirements.txt
# Set DATABASE_URL env var pointing to a local Postgres instance
uvicorn main:app --reload
```

**Frontend**
```powershell
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Secrets / GitHub Copilot

- Copy `.env.example` to `.env` in the project root and set your GitHub token. Example:

```
GITHUB_TOKEN=ghp_REPLACE_WITH_YOUR_TOKEN
```

- A GitHub account with an active **Copilot subscription** is required for the AI analysis feature.

- `.env` is ignored by git (see `.gitignore`). Commit only `.env.example` (it contains a placeholder and instructions) so collaborators know which variables to provide.

- When running with Docker Compose the `.env` file is automatically loaded by `docker compose up`.

- For CI or production, store `GITHUB_TOKEN` in your platform's secrets manager (GitHub Actions secrets, Azure Key Vault, etc.) rather than committing it.

## Frontend Routes

| Route | Description |
|------|-------------|
| `/` | Game hub home page |
| `/games/dragon-boat` | Dragon Boat setup page |
| `/games/dragon-boat/play` | Dragon Boat race screen |
| `/games/dragon-boat/leaderboard` | Dragon Boat leaderboard |
| `/games/speed-typing` | Speed Typing scaffold page |

## Dragon Boat Controls

1. Enter names for Player 1 and Player 2 in Dragon Boat setup.
2. Click Start Race.
3. Alternate your keys to paddle — you must alternate, same key twice does nothing!
   - Player 1: Arrow Left / Arrow Right
   - Player 2: A / D
4. First boat to reach the finish line wins!
5. Winner's time is saved to the leaderboard.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Basic health check |
| POST | `/api/dragon-boat/users` | Register Dragon Boat player |
| POST | `/api/dragon-boat/scores` | Submit Dragon Boat race score |
| GET  | `/api/dragon-boat/leaderboard` | Get Dragon Boat top 10 leaderboard |
| GET | `/api/speed-typing/status` | Speed Typing scaffold status |
| POST | `/api/speed-typing/scores` | Submit Speed Typing score |
| GET | `/api/speed-typing/leaderboard` | Get Speed Typing leaderboard |
