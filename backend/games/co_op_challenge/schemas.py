from pydantic import BaseModel


class CoOpAnalysisRequest(BaseModel):
    p1_name: str
    p2_name: str
    duration_ms: int
    p1_timestamps: list[float]
    p2_timestamps: list[float]


class CoOpAnalysisResponse(BaseModel):
    id: int
    analysis: str
