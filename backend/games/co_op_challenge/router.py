from fastapi import APIRouter, HTTPException
from openai import RateLimitError, AuthenticationError, OpenAIError

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
    except AuthenticationError:
        raise HTTPException(status_code=502, detail="Invalid OpenAI API key. Please check your OPENAI_API_KEY setting.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="OpenAI quota exceeded or rate limit reached. Please check your account balance and try again later.")
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")
