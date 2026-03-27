from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str


class ScoreSubmit(BaseModel):
    user_name: str
    duration_ms: int
