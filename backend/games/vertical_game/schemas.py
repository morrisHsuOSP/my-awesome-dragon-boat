from pydantic import BaseModel, Field


class VerticalGameScoreSubmit(BaseModel):
    player_name: str = Field(min_length=1, max_length=30)
    score: int = Field(ge=0)
    survival_time_ms: int = Field(ge=0)
