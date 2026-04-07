from fastapi import APIRouter, HTTPException
import httpx

from database import SessionLocal
from .schemas import TypingScoreSubmit
from . import service

QUOTES_API_URL = "https://zenquotes.io/api/quotes"

router = APIRouter(prefix="/api/speed-typing", tags=["speed-typing"])


@router.get("/status")
def status():
    return {
        "title": "Speed Typing Challenge",
        "status": "scaffold-ready",
        "message": "Core backend scaffolding is ready for gameplay logic.",
    }


@router.get("/quotes")
async def get_quotes():
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(QUOTES_API_URL)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=502, detail="No quotes returned from API")
        quotes = [
            {"id": str(i), "author": item["a"], "en": item["q"].strip()}
            for i, item in enumerate(data)
            if item.get("q") and item.get("a")
        ]
        if not quotes:
            raise HTTPException(status_code=502, detail="No valid quotes from API")
        return quotes


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
