from fastapi import APIRouter

from database import SessionLocal
from .schemas import PaddleRaceScoreSubmit
from . import service

router = APIRouter(prefix="/api/paddle-race", tags=["paddle-race"])


@router.get("/status")
def status():
    return {
        "title": "Paddle Race",
        "status": "ready",
        "message": "2-player paddle race — alternate keys to reach the finish line first!",
    }


@router.post("/scores")
def submit_score(payload: PaddleRaceScoreSubmit):
    db = SessionLocal()
    try:
        entry = service.create_paddle_race_score(
            db=db,
            winner_name=payload.winner_name,
            race_time_ms=payload.race_time_ms,
        )
        return {
            "id": entry.id,
            "winner_name": entry.winner_name,
            "race_time_ms": entry.race_time_ms,
        }
    finally:
        db.close()


@router.get("/leaderboard")
def leaderboard():
    db = SessionLocal()
    try:
        results = service.get_top_paddle_race_scores(db, limit=10)
        return [
            {
                "rank": i + 1,
                "winner_name": s.winner_name,
                "race_time_ms": s.race_time_ms,
            }
            for i, s in enumerate(results)
        ]
    finally:
        db.close()
