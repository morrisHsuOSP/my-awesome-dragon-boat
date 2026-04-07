import asyncio
import json
import logging
import os

from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import ClientAuthenticationError, HttpResponseError, ServiceRequestError

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "這是一個龍舟遊戲的賽後分析,"
    "請分析這兩個玩家在合作模式中按下按鈕的時間點, "
    "並且評估他們的合作效率和協調程度。"
    "只需要給出100字內.幽默的建議他們要如何改進他們的合作方式以提高效率和協調程度。"
    "請用繁體中文回答。"
)

ENDPOINT = os.getenv("GITHUB_MODELS_ENDPOINT", "https://models.github.ai/inference")
MODEL = os.getenv("GITHUB_MODEL", "openai/gpt-4.1")

_client: ChatCompletionsClient | None = None


def _get_client() -> ChatCompletionsClient:
    global _client
    if _client is None:
        token = os.getenv("GITHUB_TOKEN")
        if not token:
            raise ValueError("GITHUB_TOKEN environment variable not set")
        _client = ChatCompletionsClient(
            endpoint=ENDPOINT,
            credential=AzureKeyCredential(token),
        )
        logger.info("Azure AI Inference client initialized")
    return _client


async def analyze_coop_performance(
    p1_timestamps: list[float],
    p2_timestamps: list[float],
) -> str:
    client = _get_client()

    user_message = (
        "以下是兩位玩家在合作模式龍舟遊戲中的按鍵時間記錄（毫秒）。\n"
        "規則：Player 1 按 A 鍵，Player 2 按 L 鍵，必須交替按下龍舟才會前進。\n"
        f"Player 1 按鍵時間點 (ms): {json.dumps(p1_timestamps)}\n"
        f"Player 2 按鍵時間點 (ms): {json.dumps(p2_timestamps)}\n"
        f"總共按鍵次數: P1={len(p1_timestamps)} 次, P2={len(p2_timestamps)} 次\n"
        "請分析他們的節奏配合度、反應速度差異，並給出改進建議。"
    )

    logger.info("Sending chat completion request (model=%s)", MODEL)
    logger.debug("User message: %s", user_message)

    try:
        response = await asyncio.to_thread(
            client.complete,
            messages=[
                SystemMessage(SYSTEM_PROMPT),
                UserMessage(user_message),
            ],
            temperature=0.7,
            top_p=1.0,
            model=MODEL,
        )
        content = response.choices[0].message.content or ""
        logger.info("Response received (length=%d)", len(content))
        return content
    except ClientAuthenticationError as e:
        logger.error("AI authentication failed: %s", e)
        raise RuntimeError("AI authentication failed - check your GITHUB_TOKEN") from e
    except ServiceRequestError as e:
        logger.error("AI network error: %s", e)
        raise RuntimeError("AI service temporarily unreachable - please try again") from e
    except HttpResponseError as e:
        logger.error("AI API error: %s", e)
        if getattr(e, "status_code", None) == 429:
            raise RuntimeError("AI rate limit exceeded - please try again later") from e
        raise RuntimeError(f"AI service error: {e}") from e
