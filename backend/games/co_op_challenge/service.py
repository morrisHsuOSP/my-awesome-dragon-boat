from ai.client import analyze_coop_performance


async def get_coop_analysis(
    p1_timestamps: list[float],
    p2_timestamps: list[float],
) -> str:
    return await analyze_coop_performance(p1_timestamps, p2_timestamps)
