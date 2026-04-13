from sqlalchemy import asc
from sqlalchemy.orm import Session

import models


def create_paddle_race_score(db: Session, winner_name: str, race_time_ms: int):
    entry = models.PaddleRaceScore(
        winner_name=winner_name, race_time_ms=race_time_ms
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_top_paddle_race_scores(db: Session, limit: int = 10):
    return (
        db.query(models.PaddleRaceScore)
        .order_by(asc(models.PaddleRaceScore.race_time_ms))
        .limit(limit)
        .all()
    )
