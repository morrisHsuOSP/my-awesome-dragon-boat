import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

export async function submitPaddleRaceScore(winnerName: string, raceTimeMs: number) {
  const res = await API.post('/api/paddle-race/scores', {
    winner_name: winnerName,
    race_time_ms: raceTimeMs,
  })
  return res.data
}

export async function getPaddleRaceLeaderboard() {
  const res = await API.get('/api/paddle-race/leaderboard')
  return res.data as { rank: number; winner_name: string; race_time_ms: number }[]
}
