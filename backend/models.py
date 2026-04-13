from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
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


class TypingScore(Base):
    __tablename__ = "typing_scores"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False, index=True)
    wpm = Column(Integer, nullable=False)
    accuracy = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VerticalGameScore(Base):
    __tablename__ = "vertical_game_scores"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False, index=True)
    score = Column(Integer, nullable=False)
    survival_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PaddleRaceScore(Base):
    __tablename__ = "paddle_race_scores"

    id = Column(Integer, primary_key=True, index=True)
    winner_name = Column(String, nullable=False, index=True)
    race_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
