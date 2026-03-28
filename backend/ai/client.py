import os
import json

from openai import AsyncOpenAI

SYSTEM_PROMPT = (
    "這是一個龍舟遊戲的賽後分析,"
    "請分析這兩個玩家在合作模式中按下按鈕的時間點, "
    "並且評估他們的合作效率和協調程度。"
    "並給出簡短.幽默的建議他們要如何改進他們的合作方式以提高效率和協調程度。"
    "請用繁體中文回答。"
)


async def analyze_coop_performance(
    p1_timestamps: list[float],
    p2_timestamps: list[float],
) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set")

    client = AsyncOpenAI(api_key=api_key)

    user_message = json.dumps(
        {
            "player1_timestamps_ms": p1_timestamps,
            "player2_timestamps_ms": p2_timestamps,
        },
        ensure_ascii=False,
    )

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
        max_tokens=1024,
    )

    return response.choices[0].message.content or ""
