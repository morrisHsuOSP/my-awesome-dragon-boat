from pydantic import BaseModel, Field


class TypingScoreSubmit(BaseModel):
    player_name: str = Field(min_length=1, max_length=30)
    wpm: int = Field(ge=1, le=400)
    accuracy: int = Field(ge=0, le=100)
