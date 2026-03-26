from fastapi import APIRouter

from database import SessionLocal
from .schemas import TypingScoreSubmit
from . import service

router = APIRouter(prefix="/api/speed-typing", tags=["speed-typing"])


@router.get("/status")
def status():
    return {
        "title": "Speed Typing Challenge",
        "status": "scaffold-ready",
        "message": "Core backend scaffolding is ready for gameplay logic.",
    }


@router.post("/scores")
def submit_score(payload: TypingScoreSubmit):
    db = SessionLocal()
    try:
        score = service.create_typing_score(
            db=db,
            player_name=payload.player_name,
            wpm=payload.wpm,
            accuracy=payload.accuracy,
        )
        return {
            "id": score.id,
            "player_name": score.player_name,
            "wpm": score.wpm,
            "accuracy": score.accuracy,
        }
    finally:
        db.close()


@router.get("/leaderboard")
def leaderboard():
    db = SessionLocal()
    try:
        results = service.get_top_typing_scores(db, limit=10)
        return [
            {
                "rank": i + 1,
                "player_name": s.player_name,
                "wpm": s.wpm,
                "accuracy": s.accuracy,
            }
            for i, s in enumerate(results)
        ]
    finally:
        db.close()
