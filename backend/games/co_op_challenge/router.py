from fastapi import APIRouter, HTTPException
from openai import RateLimitError, AuthenticationError, OpenAIError

from database import SessionLocal
from .schemas import CoOpAnalysisRequest, CoOpAnalysisResponse
from . import service

router = APIRouter(prefix="/api/co-op-challenge", tags=["co-op-challenge"])


@router.post("/analyze", response_model=CoOpAnalysisResponse)
async def analyze(payload: CoOpAnalysisRequest):
    analysis: str | None = None
    try:
        analysis = await service.get_coop_analysis(
            payload.p1_timestamps,
            payload.p2_timestamps,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except AuthenticationError:
        raise HTTPException(status_code=502, detail="Invalid OpenAI API key. Please check your OPENAI_API_KEY setting.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="OpenAI quota exceeded or rate limit reached. Please check your account balance and try again later.")
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")

    db = SessionLocal()
    try:
        result = service.create_coop_result(
            db=db,
            p1_name=payload.p1_name,
            p2_name=payload.p2_name,
            duration_ms=payload.duration_ms,
            p1_timestamps=payload.p1_timestamps,
            p2_timestamps=payload.p2_timestamps,
            ai_analysis=analysis,
        )
        return CoOpAnalysisResponse(id=result.id, analysis=analysis or "")
    finally:
        db.close()
