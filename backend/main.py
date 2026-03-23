from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from database import SessionLocal, engine
import models
import crud

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dragon Boat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    name: str


class ScoreSubmit(BaseModel):
    user_name: str
    duration_ms: int  # duration in milliseconds (lower = better)


@app.post("/users")
def create_user(payload: UserCreate):
    db = SessionLocal()
    try:
        existing = crud.get_user_by_name(db, payload.name)
        if existing:
            return {"id": existing.id, "name": existing.name}
        user = crud.create_user(db, payload.name)
        return {"id": user.id, "name": user.name}
    finally:
        db.close()


@app.post("/scores")
def submit_score(payload: ScoreSubmit):
    db = SessionLocal()
    try:
        user = crud.get_user_by_name(db, payload.user_name)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        score = crud.create_score(db, user.id, payload.duration_ms)
        return {"id": score.id, "user_name": payload.user_name, "duration_ms": score.duration_ms}
    finally:
        db.close()


@app.get("/leaderboard")
def get_leaderboard():
    db = SessionLocal()
    try:
        results = crud.get_top_scores(db, limit=10)
        return [{"rank": i + 1, "user_name": r.name, "duration_ms": r.duration_ms} for i, r in enumerate(results)]
    finally:
        db.close()
