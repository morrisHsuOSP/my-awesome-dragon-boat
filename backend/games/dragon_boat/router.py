from fastapi import APIRouter, HTTPException
import logging

from database import SessionLocal
from .schemas import UserCreate, ScoreSubmit
from . import service
from .challenge_wall_service import DragonBoatChallengeWallService

router = APIRouter(prefix="/api/dragon-boat", tags=["dragon-boat"])
logger = logging.getLogger(__name__)
challenge_wall_service = DragonBoatChallengeWallService()


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

        previous_best = service.get_best_score_for_user(db, user.id)
        previous_best_ms = int(previous_best.duration_ms) if previous_best else None
        score = service.create_score(db, user.id, payload.duration_ms)

        # Wall updates are best-effort and should not block score submission.
        try:
            challenge_wall_service.process_new_score(
                db,
                challenger_user_id=user.id,
                score_id=score.id,
                previous_best_ms=previous_best_ms,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception("dragon_boat_challenge_wall_pipeline_failed error=%s", exc)

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


@router.get("/challenge-feed")
def get_challenge_feed(limit: int = 5):
    db = SessionLocal()
    try:
        safe_limit = max(1, min(limit, 5))
        return challenge_wall_service.get_wall_feed(db, limit=safe_limit)
    finally:
        db.close()
