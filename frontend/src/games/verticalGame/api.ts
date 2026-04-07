import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

export async function submitVerticalGameScore(playerName: string, score: number, survivalTimeMs: number) {
  const res = await API.post('/api/vertical-game/scores', {
    player_name: playerName,
    score,
    survival_time_ms: survivalTimeMs,
  })
  return res.data
}

export async function getVerticalGameLeaderboard() {
  const res = await API.get('/api/vertical-game/leaderboard')
  return res.data as { rank: number; player_name: string; score: number; survival_time_ms: number }[]
}
