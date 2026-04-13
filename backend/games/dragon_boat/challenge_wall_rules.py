import re
from datetime import datetime, timezone
from typing import TypedDict

from sqlalchemy import asc, func
from sqlalchemy.orm import Session

import models

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


class ChallengeWallEvent(TypedDict):
    event_id: str
    event_type: str
    occurred_at: str
    challenger_user_id: int
    challenged_user_id: int
    challenged_email: str
    challenged_display_name: str
    challenger_display_name: str
    old_rank: int
    new_rank: int
    delta_ms: int


def _is_email(value: str) -> bool:
    return bool(value and EMAIL_REGEX.match(value))


def _get_best_scores_by_user(db: Session):
    rows = (
        db.query(models.User.id, models.User.name, func.min(models.Score.duration_ms).label("best_ms"))
        .join(models.Score, models.Score.user_id == models.User.id)
        .group_by(models.User.id, models.User.name)
        .order_by(asc("best_ms"))
        .all()
    )

    leaderboard = []
    for idx, row in enumerate(rows, start=1):
        leaderboard.append(
            {
                "rank": idx,
                "user_id": row.id,
                "name": row.name,
                "best_ms": int(row.best_ms),
            }
        )
    return leaderboard


def build_challenge_wall_events(db: Session, challenger_user_id: int) -> list[ChallengeWallEvent]:
    leaderboard = _get_best_scores_by_user(db)
    challenger = next((r for r in leaderboard if r["user_id"] == challenger_user_id), None)
    if not challenger:
        return []

    events: list[ChallengeWallEvent] = []
    for entry in leaderboard:
        if entry["user_id"] == challenger_user_id:
            continue

        # Overtaken in current leaderboard ordering (higher rank number means behind).
        if entry["rank"] > challenger["rank"] and entry["best_ms"] > challenger["best_ms"]:
            if not _is_email(entry["name"]):
                continue

            events.append(
                {
                    "event_id": f"overtaken-{challenger_user_id}-{entry['user_id']}-{int(datetime.now(timezone.utc).timestamp())}",
                    "event_type": "overtaken",
                    "occurred_at": datetime.now(timezone.utc).isoformat(),
                    "challenger_user_id": challenger["user_id"],
                    "challenged_user_id": entry["user_id"],
                    "challenged_email": entry["name"],
                    "challenged_display_name": entry["name"].split("@")[0],
                    "challenger_display_name": challenger["name"].split("@")[0],
                    "old_rank": max(1, entry["rank"] - 1),
                    "new_rank": entry["rank"],
                    "delta_ms": challenger["best_ms"] - entry["best_ms"],
                }
            )

    return events
