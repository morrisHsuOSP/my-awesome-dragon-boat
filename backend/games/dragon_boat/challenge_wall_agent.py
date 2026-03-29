from dataclasses import dataclass


@dataclass
class WallMessage:
    headline: str
    body: str
    tone: str
    priority: str
    scenario: str


class ChallengeWallAgent:
    """Template-based AI-agent placeholder for challenge wall copy."""

    def generate_wall_message(self, event: dict) -> WallMessage:
        challenger = event.get("challenger_display_name", "A rival")
        challenged = event.get("challenged_display_name", "another player")
        delta_ms = abs(int(event.get("delta_ms", 0)))
        delta_sec = delta_ms / 1000
        old_rank = int(event.get("old_rank", 0) or 0)
        new_rank = int(event.get("new_rank", 0) or 0)

        if new_rank <= 3:
            scenario = "podium_upset"
            tone = "heated"
            priority = "high"
            headline = f"Podium Shake-Up: {challenger} climbs to #{max(1, new_rank - 1)}"
            body = f"{challenged} slipped from #{old_rank} to #{new_rank} after a {delta_sec:.2f}s swing."
        elif delta_ms <= 500:
            scenario = "photo_finish"
            tone = "tense"
            priority = "high"
            headline = "Photo Finish Battle"
            body = f"{challenger} edged past {challenged} by only {delta_sec:.2f}s."
        elif delta_ms <= 1500:
            scenario = "close_chase"
            tone = "competitive"
            priority = "medium"
            headline = "Close Chase Detected"
            body = f"{challenger} took the lane over {challenged} with a {delta_sec:.2f}s advantage."
        else:
            scenario = "clear_overtake"
            tone = "momentum"
            priority = "medium"
            headline = f"Momentum Shift: {challenger} moves ahead"
            body = f"{challenger} opened a {delta_sec:.2f}s gap and pushed {challenged} down to #{new_rank}."

        return WallMessage(
            headline=headline,
            body=body,
            tone=tone,
            priority=priority,
            scenario=scenario,
        )
