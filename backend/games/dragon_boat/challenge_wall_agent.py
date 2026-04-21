import random
from dataclasses import dataclass


@dataclass
class WallMessage:
    headline: str
    body: str
    tone: str
    priority: str
    scenario: str


class ChallengeWallAgent:
    """Template-based AI-agent with diverse, engaging challenge wall copy."""

    def generate_wall_message(self, event: dict) -> WallMessage:
        event_type = event.get("event_type", "")
        challenger = event.get("challenger_display_name", "某位選手")
        challenged = event.get("challenged_display_name", "另一位選手")
        delta_ms = abs(int(event.get("delta_ms", 0)))
        delta_sec = delta_ms / 1000
        old_rank = int(event.get("old_rank", 0) or 0)
        new_rank = int(event.get("new_rank", 0) or 0)
        overtaken_count = max(0, old_rank - new_rank)

        if event_type == "race_finished":
            scenario = "clear_overtake"
            priority = "medium"
            duration_ms = int(event.get("duration_ms", 0) or 0)
            duration_sec = duration_ms / 1000
            if duration_ms <= 0:
                variants = [
                    {
                        "headline": f"🎯 {challenger} 的新紀錄出爐了！",
                        "body": f"{challenger} 又跑出了超群的成績，真的讚不絕口啦！",
                        "tone": "momentum",
                    },
                    {
                        "headline": f"✨ 恭禧 {challenger}！",
                        "body": f"又一個新成績誕生了！{challenger} 穩定發揮，衝進排行榜，繼續加油啦～",
                        "tone": "momentum",
                    },
                    {
                        "headline": f"🚀 {challenger} 來勢洶洶啦！",
                        "body": f"{challenger} 完成新挑戰，以穩定的步調寫下新紀錄，真的超強～",
                        "tone": "momentum",
                    },
                    {
                        "headline": f"💪 又有新黑馬了！",
                        "body": f"{challenger} 划出新時代的成績，期待他下一場的表現！",
                        "tone": "momentum",
                    },
                ]
                chosen = random.choice(variants)
                return WallMessage(
                    headline=chosen["headline"],
                    body=chosen["body"],
                    tone=chosen["tone"],
                    priority=priority,
                    scenario=scenario,
                )
            variants = [
                {
                    "headline": f"🎯 {challenger} 的新紀錄出爐了！",
                    "body": f"{challenger} 划出 {duration_sec:.2f} 秒的佳績，真的讚不絕口啦！",
                    "tone": "momentum",
                },
                {
                    "headline": f"✨ 恭禧 {challenger}！",
                    "body": f"又一個新成績誕生了！{challenger} 以 {duration_sec:.2f} 秒衝進排行榜，繼續加油啦～",
                    "tone": "momentum",
                },
                {
                    "headline": f"🚀 {challenger} 來勢洶洶啦！",
                    "body": f"{challenger} 完成新挑戰，{duration_sec:.2f} 秒的成績真的超強～",
                    "tone": "momentum",
                },
                {
                    "headline": f"💪 又有新黑馬了！",
                    "body": f"{challenger} 划出 {duration_sec:.2f} 秒新時代，期待他下一場的表現！",
                    "tone": "momentum",
                },
            ]
            chosen = random.choice(variants)
            return WallMessage(
                headline=chosen["headline"],
                body=chosen["body"],
                tone=chosen["tone"],
                priority=priority,
                scenario=scenario,
            )

        if overtaken_count > 1:
            priority = "high" if new_rank <= 3 else "medium"
            if new_rank <= 3:
                scenario = "podium_upset"
                variants = [
                    {
                        "headline": f"🏆 頒獎台震盪！{challenger} 一舉打敗 {overtaken_count} 位對手！",
                        "body": f"太驚人了！{challenger} 以驚人的 {delta_sec:.2f} 秒優勢衝過整個排行榜，前段排名全面洗牌！",
                        "tone": "heated",
                    },
                    {
                        "headline": f"🔥 {challenger} 強勢登頂！",
                        "body": f"史詩級的衝刺！{challenger} 一口氣超越 {overtaken_count} 位，領先優勢達 {delta_sec:.2f} 秒，根本無人能擋！",
                        "tone": "heated",
                    },
                    {
                        "headline": f"⚡ 怪獸級表現！",
                        "body": f"{challenger} 如同龍捲風般地衝過對手，{overtaken_count} 位選手都被超越，優勢達 {delta_sec:.2f} 秒，不可思議！",
                        "tone": "heated",
                    },
                ]
            elif delta_ms <= 1500:
                scenario = "close_chase"
                variants = [
                    {
                        "headline": f"💨 連續反超戲碼再次上演！",
                        "body": f"{challenger} 在短時間內接連超越 {overtaken_count} 位選手，領先幅度達 {delta_sec:.2f} 秒，真的扯！",
                        "tone": "competitive",
                    },
                    {
                        "headline": f"🎮 {challenger} 開啟殺戮模式！",
                        "body": f"一次超過 {overtaken_count} 人！{challenger} 的節奏無法阻擋，以 {delta_sec:.2f} 秒的優勢衝向前方！",
                        "tone": "competitive",
                    },
                    {
                        "headline": f"⚔️ 逆襲開始！",
                        "body": f"{challenger} 不只超越了，還一口氣通過 {overtaken_count} 位對手，領先 {delta_sec:.2f} 秒，後浪推前浪呢！",
                        "tone": "competitive",
                    },
                ]
            else:
                scenario = "clear_overtake"
                variants = [
                    {
                        "headline": f"💪 {challenger} 的氣勢爆發！",
                        "body": f"一次超越 {overtaken_count} 位，{challenger} 拉開 {delta_sec:.2f} 秒的巨大優勢，真的拚勁十足～",
                        "tone": "momentum",
                    },
                    {
                        "headline": f"🌊 浪潮來襲！",
                        "body": f"{challenger} 划出驚人的 {delta_sec:.2f} 秒優勢，連過 {overtaken_count} 人，領先其他選手！",
                        "tone": "momentum",
                    },
                    {
                        "headline": f"🏃 {challenger} 一鳴驚人！",
                        "body": f"默默醞釀一次超越 {overtaken_count} 位的偉大成就，{challenger} 現在領先 {delta_sec:.2f} 秒，咱們一起為他喝彩！",
                        "tone": "momentum",
                    },
                ]
            chosen = random.choice(variants)
            return WallMessage(
                headline=chosen["headline"],
                body=chosen["body"],
                tone=chosen["tone"],
                priority=priority,
                scenario=scenario,
            )

        # 單人超越的各情況
        if new_rank <= 3:
            scenario = "podium_upset"
            priority = "high"
            variants = [
                {
                    "headline": f"🏆 榜首換人！{challenger} 衝進頂級行列！",
                    "body": f"{challenger} 以 {delta_sec:.2f} 秒的優勢打敗 {challenged}，成功擠進排行榜前三甲！",
                    "tone": "heated",
                },
                {
                    "headline": f"⭐ {challenger} 闖進前三甲！",
                    "body": f"終於到來的時刻！{challenger} 超越了 {challenged}，領先幅度達 {delta_sec:.2f} 秒，恭禧恭禧！",
                    "tone": "heated",
                },
                {
                    "headline": f"🎖️ 歷史時刻！",
                    "body": f"{challenger} 正式打敗 {challenged}，以 {delta_sec:.2f} 秒優勢挺進排行榜頂層，了不起！",
                    "tone": "heated",
                },
            ]
        elif delta_ms <= 500:
            scenario = "photo_finish"
            priority = "high"
            variants = [
                {
                    "headline": f"⚡ 毫秒級的對決！",
                    "body": f"險勝！{challenger} 只以 {delta_sec:.2f} 秒的差距超越 {challenged}，真的超級刺激啦！",
                    "tone": "tense",
                },
                {
                    "headline": f"💥 終點線前的逆轉！",
                    "body": f"天啊！{challenger} 用了 {delta_sec:.2f} 秒的極小差距超過 {challenged}，根本是驚心動魄！",
                    "tone": "tense",
                },
                {
                    "headline": f"🎬 好險好險！",
                    "body": f"{challenger} 以微乎其微的 {delta_sec:.2f} 秒優勢成功反超 {challenged}，這場比賽真的絕了！",
                    "tone": "tense",
                },
            ]
        elif delta_ms <= 1500:
            scenario = "close_chase"
            priority = "medium"
            variants = [
                {
                    "headline": f"🎯 近距離纏鬥！",
                    "body": f"{challenger} 以 {delta_sec:.2f} 秒優勢成功超越 {challenged}，兩人實力真的不分高下！",
                    "tone": "competitive",
                },
                {
                    "headline": f"🏅 排名交換！",
                    "body": f"{challenger} 展現實力！以 {delta_sec:.2f} 秒的努力反超 {challenged}，看來今天狀態不錯呢！",
                    "tone": "competitive",
                },
                {
                    "headline": f"💪 反超成功！",
                    "body": f"{challenger} 穩定發揮，以 {delta_sec:.2f} 秒的差距超越 {challenged}，逐漸往頂端邁進！",
                    "tone": "competitive",
                },
            ]
        else:
            scenario = "clear_overtake"
            priority = "medium"
            variants = [
                {
                    "headline": f"🌟 {challenger} 取得領先！",
                    "body": f"{challenger} 拉開 {delta_sec:.2f} 秒的差距，成功超越 {challenged}，加油啦！",
                    "tone": "momentum",
                },
                {
                    "headline": f"🚀 前進前進！",
                    "body": f"{challenger} 終於超過 {challenged} 了！{delta_sec:.2f} 秒的優勢穩穩地保住領先位置！",
                    "tone": "momentum",
                },
                {
                    "headline": f"✨ 又是一次突破！",
                    "body": f"{challenger} 發揮穩定，以 {delta_sec:.2f} 秒超越 {challenged}，逐漸往頂端邁進，期待他更好的表現！",
                    "tone": "momentum",
                },
                {
                    "headline": f"📈 排名提升中！",
                    "body": f"{challenger} 滿滿的鬥志！超越 {challenged}，拉開 {delta_sec:.2f} 秒距離，穩定領先！",
                    "tone": "momentum",
                },
            ]
        
        chosen = random.choice(variants)
        return WallMessage(
            headline=chosen["headline"],
            body=chosen["body"],
            tone=chosen["tone"],
            priority=priority,
            scenario=scenario,
        )
