from sqlalchemy.orm import Session

import models
from ai.client import analyze_coop_performance


async def get_coop_analysis(
    p1_timestamps: list[float],
    p2_timestamps: list[float],
) -> str:
    return await analyze_coop_performance(p1_timestamps, p2_timestamps)


def get_or_create_user(db: Session, name: str) -> models.User:
    user = db.query(models.User).filter(models.User.name == name).first()
    if not user:
        user = models.User(name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def create_coop_result(
    db: Session,
    p1_name: str,
    p2_name: str,
    duration_ms: int,
    p1_timestamps: list[float],
    p2_timestamps: list[float],
    ai_analysis: str | None,
) -> models.CoOpResult:
    p1_user = get_or_create_user(db, p1_name)
    p2_user = get_or_create_user(db, p2_name)
    result = models.CoOpResult(
        p1_user_id=p1_user.id,
        p2_user_id=p2_user.id,
        duration_ms=duration_ms,
        p1_timestamps=p1_timestamps,
        p2_timestamps=p2_timestamps,
        ai_analysis=ai_analysis,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
