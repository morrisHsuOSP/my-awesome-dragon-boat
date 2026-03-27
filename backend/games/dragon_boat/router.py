from fastapi import APIRouter, HTTPException

from database import SessionLocal
from .schemas import UserCreate, ScoreSubmit
from . import service

router = APIRouter(prefix="/api/dragon-boat", tags=["dragon-boat"])


@router.post("/users")
def create_user(payload: UserCreate):
    db = SessionLocal()
    try:
        existing = service.get_user_by_name(db, payload.name)
        if existing:
            return {"id": existing.id, "name": existing.name}

        user = service.create_user(db, payload.name)
        return {"id": user.id, "name": user.name}
    finally:
        db.close()


@router.post("/scores")
def submit_score(payload: ScoreSubmit):
    db = SessionLocal()
    try:
        user = service.get_user_by_name(db, payload.user_name)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        score = service.create_score(db, user.id, payload.duration_ms)
        return {
            "id": score.id,
            "user_name": payload.user_name,
            "duration_ms": score.duration_ms,
        }
    finally:
        db.close()


@router.get("/leaderboard")
def get_leaderboard():
    db = SessionLocal()
    try:
        results = service.get_top_scores(db, limit=10)
        return [
            {"rank": i + 1, "user_name": r.name, "duration_ms": r.duration_ms}
            for i, r in enumerate(results)
        ]
    finally:
        db.close()
