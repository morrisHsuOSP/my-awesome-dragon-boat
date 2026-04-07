from sqlalchemy import desc
from sqlalchemy.orm import Session

import models


def create_vertical_game_score(db: Session, player_name: str, score: int, survival_time_ms: int):
    entry = models.VerticalGameScore(
        player_name=player_name, score=score, survival_time_ms=survival_time_ms
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_top_vertical_game_scores(db: Session, limit: int = 10):
    return (
        db.query(models.VerticalGameScore)
        .order_by(desc(models.VerticalGameScore.score), desc(models.VerticalGameScore.survival_time_ms))
        .limit(limit)
        .all()
    )
