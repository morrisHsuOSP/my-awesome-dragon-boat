from sqlalchemy import desc
from sqlalchemy.orm import Session

import models


def create_typing_score(db: Session, player_name: str, wpm: int, accuracy: int):
    score = models.TypingScore(player_name=player_name, wpm=wpm, accuracy=accuracy)
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


def get_top_typing_scores(db: Session, limit: int = 10):
    return (
        db.query(models.TypingScore)
        .order_by(desc(models.TypingScore.wpm), desc(models.TypingScore.accuracy))
        .limit(limit)
        .all()
    )
