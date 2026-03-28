from fastapi import APIRouter, HTTPException

from .schemas import CoOpAnalysisRequest, CoOpAnalysisResponse
from . import service

router = APIRouter(prefix="/api/co-op-challenge", tags=["co-op-challenge"])


@router.post("/analyze", response_model=CoOpAnalysisResponse)
async def analyze(payload: CoOpAnalysisRequest):
    try:
        analysis = await service.get_coop_analysis(
            payload.p1_timestamps,
            payload.p2_timestamps,
        )
        return CoOpAnalysisResponse(analysis=analysis)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
