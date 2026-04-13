import logging

from fastapi import APIRouter, HTTPException
import httpx

from database import SessionLocal
from .schemas import TypingScoreSubmit
from . import service

logger = logging.getLogger(__name__)

QUOTES_API_URL = "https://zenquotes.io/api/quotes"

FALLBACK_QUOTES = [
    {"id": "f0", "author": "Linus Torvalds", "en": "Talk is cheap. Show me the code."},
    {"id": "f1", "author": "Donald Knuth", "en": "Premature optimization is the root of all evil."},
    {"id": "f2", "author": "Martin Fowler", "en": "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."},
    {"id": "f3", "author": "Kent Beck", "en": "Make it work, make it right, make it fast."},
    {"id": "f4", "author": "Brian Kernighan", "en": "Controlling complexity is the essence of computer programming."},
    {"id": "f5", "author": "Edsger Dijkstra", "en": "Simplicity is prerequisite for reliability."},
    {"id": "f6", "author": "Grace Hopper", "en": "The most damaging phrase in the language is: We have always done it this way."},
    {"id": "f7", "author": "Alan Kay", "en": "The best way to predict the future is to invent it."},
    {"id": "f8", "author": "Robert C. Martin", "en": "Truth can only be found in one place: the code."},
    {"id": "f9", "author": "Fred Brooks", "en": "Adding manpower to a late software project makes it later."},
]

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
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(QUOTES_API_URL)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list) or len(data) == 0:
                raise ValueError("Empty or invalid response from upstream")
            quotes = [
                {"id": str(i), "author": item["a"], "en": item["q"].strip()}
                for i, item in enumerate(data)
                if item.get("q") and item.get("a")
            ]
            if quotes:
                return quotes
    except Exception as exc:
        logger.warning("Upstream quotes API failed, using fallback: %s", exc)

    return FALLBACK_QUOTES


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
