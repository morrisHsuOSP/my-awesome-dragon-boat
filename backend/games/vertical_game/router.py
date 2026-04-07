from fastapi import APIRouter

from database import SessionLocal
from .schemas import VerticalGameScoreSubmit
from . import service

router = APIRouter(prefix="/api/vertical-game", tags=["vertical-game"])


@router.get("/status")
def status():
    return {
        "title": "Vertical River Game",
        "status": "ready",
        "message": "Navigate your boat down the river and dodge obstacles!",
    }


@router.post("/scores")
def submit_score(payload: VerticalGameScoreSubmit):
    db = SessionLocal()
    try:
        entry = service.create_vertical_game_score(
            db=db,
            player_name=payload.player_name,
            score=payload.score,
            survival_time_ms=payload.survival_time_ms,
        )
        return {
            "id": entry.id,
            "player_name": entry.player_name,
            "score": entry.score,
            "survival_time_ms": entry.survival_time_ms,
        }
    finally:
        db.close()


@router.get("/leaderboard")
def leaderboard():
    db = SessionLocal()
    try:
        results = service.get_top_vertical_game_scores(db, limit=10)
        return [
            {
                "rank": i + 1,
                "player_name": s.player_name,
                "score": s.score,
                "survival_time_ms": s.survival_time_ms,
            }
            for i, s in enumerate(results)
        ]
    finally:
        db.close()
