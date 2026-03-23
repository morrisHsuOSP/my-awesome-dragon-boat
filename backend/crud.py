from sqlalchemy.orm import Session
from sqlalchemy import asc
import models


def get_user_by_name(db: Session, name: str):
    return db.query(models.User).filter(models.User.name == name).first()


def create_user(db: Session, name: str):
    user = models.User(name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_score(db: Session, user_id: int, duration_ms: int):
    score = models.Score(user_id=user_id, duration_ms=duration_ms)
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


def get_top_scores(db: Session, limit: int = 10):
    """Return top N scores (lowest duration = best), joined with user names."""
    return (
        db.query(models.User.name, models.Score.duration_ms)
        .join(models.Score, models.User.id == models.Score.user_id)
        .order_by(asc(models.Score.duration_ms))
        .limit(limit)
        .all()
    )
