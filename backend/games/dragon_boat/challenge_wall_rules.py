from datetime import datetime, timezone
from typing import TypedDict

from sqlalchemy import asc
from sqlalchemy.orm import Session

import models


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
    duration_ms: int  # This race's time in milliseconds


def _get_score_leaderboard(db: Session):
    rows = (
        db.query(
            models.Score.id.label("score_id"),
            models.User.id.label("user_id"),
            models.User.name.label("user_name"),
            models.Score.duration_ms.label("duration_ms"),
        )
        .join(models.Score, models.Score.user_id == models.User.id)
        .order_by(asc(models.Score.duration_ms), asc(models.Score.id))
        .all()
    )

    leaderboard = []
    for idx, row in enumerate(rows, start=1):
        leaderboard.append(
            {
                "score_id": row.score_id,
                "rank": idx,
                "user_id": row.user_id,
                "player_id": row.user_id,
                "name": row.user_name,
                "duration_ms": int(row.duration_ms),
            }
        )
    return leaderboard


def build_challenge_wall_events(
    db: Session,
    challenger_user_id: int,
    score_id: int,
    previous_best_ms: int | None = None,
) -> list[ChallengeWallEvent]:
    leaderboard = _get_score_leaderboard(db)
    challenger = next((r for r in leaderboard if r["score_id"] == score_id), None)
    if not challenger:
        return []

    current_duration_ms = challenger["duration_ms"]
    overtaken_entries = []
    if previous_best_ms is not None and current_duration_ms < previous_best_ms:
        for entry in leaderboard:
            if entry["score_id"] == score_id:
                continue
            if current_duration_ms < entry["duration_ms"] <= previous_best_ms:
                overtaken_entries.append(entry)

    if overtaken_entries:
        reference_entry = min(overtaken_entries, key=lambda entry: entry["rank"])
        overtaken_count = len(overtaken_entries)
        now = datetime.now(timezone.utc)
        return [
            {
                "event_id": f"overtaken-{challenger_user_id}-{score_id}-{int(now.timestamp())}",
                "event_type": "overtaken",
                "occurred_at": now.isoformat(),
                "challenger_user_id": challenger_user_id,
                "challenged_user_id": reference_entry["player_id"],
                "challenged_email": reference_entry["name"],
                "challenged_display_name": reference_entry["name"].split("@")[0],
                "challenger_display_name": challenger["name"].split("@")[0],
                "old_rank": challenger["rank"] + overtaken_count,
                "new_rank": challenger["rank"],
                "delta_ms": current_duration_ms - reference_entry["duration_ms"],
                "duration_ms": current_duration_ms,
            }
        ]

    # Ensure challenge wall updates on every new race result, even without an overtaken rival.
    challenger_name = challenger["name"] or "player@example.com"
    challenger_display = challenger_name.split("@")[0]
    now = datetime.now(timezone.utc)
    return [
        {
            "event_id": f"race-finished-{challenger_user_id}-{score_id}-{int(now.timestamp() * 1000)}",
            "event_type": "race_finished",
            "occurred_at": now.isoformat(),
            "challenger_user_id": challenger_user_id,
            "challenged_user_id": challenger["user_id"],
            "challenged_email": challenger_name,
            "challenged_display_name": "the clock",
            "challenger_display_name": challenger_display,
            "old_rank": challenger["rank"],
            "new_rank": challenger["rank"],
            "delta_ms": 0,
            "duration_ms": current_duration_ms,
        }
    ]
