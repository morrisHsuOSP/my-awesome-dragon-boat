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
