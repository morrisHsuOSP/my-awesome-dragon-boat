from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duration_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CoOpResult(Base):
    __tablename__ = "co_op_results"

    id = Column(Integer, primary_key=True, index=True)
    p1_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    p2_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duration_ms = Column(Integer, nullable=False)
    p1_timestamps = Column(ARRAY(FLOAT), nullable=False)
    p2_timestamps = Column(ARRAY(FLOAT), nullable=False)
    ai_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TypingScore(Base):
    __tablename__ = "typing_scores"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False, index=True)
    wpm = Column(Integer, nullable=False)
    accuracy = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChallengeEvent(Base):
    __tablename__ = "challenge_events"

    id = Column(Integer, primary_key=True, index=True)
    event_key = Column(String, unique=True, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    challenger_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    challenged_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_email = Column(String, nullable=False, index=True)
    old_rank = Column(Integer, nullable=False)
    new_rank = Column(Integer, nullable=False)
    delta_ms = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")
    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class NotificationLog(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    challenge_event_id = Column(Integer, ForeignKey("challenge_events.id"), nullable=False, index=True)
    channel = Column(String, nullable=False, default="email")
    to_email = Column(String, nullable=False, index=True)
    subject = Column(String, nullable=False)
    preview_text = Column(String, nullable=True)
    body_text = Column(Text, nullable=False)
    provider_status = Column(String, nullable=False, default="queued")
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class VerticalGameScore(Base):
    __tablename__ = "vertical_game_scores"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False, index=True)
    score = Column(Integer, nullable=False)
    survival_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
