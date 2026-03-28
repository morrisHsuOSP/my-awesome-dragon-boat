from pydantic import BaseModel


class CoOpAnalysisRequest(BaseModel):
    p1_timestamps: list[float]
    p2_timestamps: list[float]


class CoOpAnalysisResponse(BaseModel):
    analysis: str
