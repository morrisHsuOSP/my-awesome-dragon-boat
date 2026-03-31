import asyncio
import json
import os

from copilot import CopilotClient, PermissionHandler, SubprocessConfig

SYSTEM_PROMPT = (
    "這是一個龍舟遊戲的賽後分析,"
    "請分析這兩個玩家在合作模式中按下按鈕的時間點, "
    "並且評估他們的合作效率和協調程度。"
    "並給出簡短.幽默的建議他們要如何改進他們的合作方式以提高效率和協調程度。"
    "請用繁體中文回答。"
)

_client: CopilotClient | None = None


async def _get_client() -> CopilotClient:
    global _client
    if _client is None:
        github_token = os.getenv("GITHUB_TOKEN")
        config = SubprocessConfig(github_token=github_token) if github_token else None
        _client = CopilotClient(config)
        await _client.start()
    return _client


async def analyze_coop_performance(
    p1_timestamps: list[float],
    p2_timestamps: list[float],
) -> str:
    client = await _get_client()

    user_message = json.dumps(
        {
            "player1_timestamps_ms": p1_timestamps,
            "player2_timestamps_ms": p2_timestamps,
        },
        ensure_ascii=False,
    )

    response_text = ""
    done = asyncio.Event()

    async with await client.create_session(
        on_permission_request=PermissionHandler.approve_all,
        model="gpt-4o-mini",
        system_message={"mode": "replace", "content": SYSTEM_PROMPT},
        available_tools=[],
        infinite_sessions={"enabled": False},
    ) as session:

        def on_event(event):
            nonlocal response_text
            if event.type.value == "assistant.message":
                response_text = event.data.content
            elif event.type.value == "session.idle":
                done.set()

        session.on(on_event)
        await session.send(user_message)
        await done.wait()

    return response_text or ""
