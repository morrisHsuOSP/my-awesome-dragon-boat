from pydantic import BaseModel, Field


class PaddleRaceScoreSubmit(BaseModel):
    winner_name: str = Field(min_length=1, max_length=30)
    race_time_ms: int = Field(ge=0)
