import logging

from sqlalchemy.orm import Session
from sqlalchemy.orm import aliased

import models

from .challenge_wall_agent import ChallengeWallAgent
from .challenge_wall_rules import ChallengeWallEvent, build_challenge_wall_events

logger = logging.getLogger(__name__)


class DragonBoatChallengeWallService:
    """Coordinates challenge rules and AI-style wall content generation."""

    def __init__(self):
        self.agent = ChallengeWallAgent()

    def process_new_score(self, db: Session, challenger_user_id: int):
        events: list[ChallengeWallEvent] = build_challenge_wall_events(
            db, challenger_user_id=challenger_user_id
        )
        if not events:
            return []

        # MVP safety cap per score submission.
        events = events[:2]
        results = []

        for event in events:
            try:
                challenge_event = models.ChallengeEvent(
                    event_key=event["event_id"],
                    event_type=event["event_type"],
                    challenger_user_id=event["challenger_user_id"],
                    challenged_user_id=event["challenged_user_id"],
                    recipient_email=event["challenged_email"],
                    old_rank=event["old_rank"],
                    new_rank=event["new_rank"],
                    delta_ms=event["delta_ms"],
                    status="pending",
                )
                db.add(challenge_event)
                db.flush()

                wall_message = self.agent.generate_wall_message(event)

                wall_log = models.NotificationLog(
                    challenge_event_id=challenge_event.id,
                    channel="wall",
                    to_email=event["challenged_email"],
                    subject=wall_message.headline,
                    preview_text=wall_message.body,
                    body_text=wall_message.body,
                    provider_status="published",
                )
                db.add(wall_log)

                challenge_event.status = "published"
                db.commit()
                results.append(
                    {
                        "status": "published",
                        "event_id": event["event_id"],
                        "scenario": wall_message.scenario,
                        "priority": wall_message.priority,
                    }
                )
            except Exception as exc:  # pragma: no cover
                db.rollback()
                logger.exception(
                    "challenge_wall_event_publish_failed event_id=%s error=%s",
                    event.get("event_id"),
                    exc,
                )

        return results

    def get_wall_feed(self, db: Session, limit: int = 5):
        challenger_user = aliased(models.User)
        challenged_user = aliased(models.User)

        rows = (
            db.query(models.ChallengeEvent, challenger_user.name, challenged_user.name)
            .join(challenger_user, challenger_user.id == models.ChallengeEvent.challenger_user_id)
            .join(challenged_user, challenged_user.id == models.ChallengeEvent.challenged_user_id)
            .order_by(models.ChallengeEvent.created_at.desc())
            .limit(limit)
            .all()
        )

        feed = []
        for event, challenger_name, challenged_name in rows:
            challenger_display = (challenger_name or "A rival").split("@")[0]
            challenged_display = (challenged_name or "Player").split("@")[0]
            wall_message = self.agent.generate_wall_message(
                {
                    "challenger_display_name": challenger_display,
                    "challenged_display_name": challenged_display,
                    "delta_ms": event.delta_ms,
                    "old_rank": event.old_rank,
                    "new_rank": event.new_rank,
                }
            )
            feed.append(
                {
                    "wall_event_key": event.event_key,
                    "wall_event_type": event.event_type,
                    "occurred_at": event.occurred_at,
                    "challenger_name": challenger_display,
                    "challenged_name": challenged_display,
                    "old_rank": event.old_rank,
                    "new_rank": event.new_rank,
                    "delta_ms": event.delta_ms,
                    "headline": wall_message.headline,
                    "body": wall_message.body,
                    "tone": wall_message.tone,
                    "priority": wall_message.priority,
                    "scenario": wall_message.scenario,
                }
            )

        return feed
