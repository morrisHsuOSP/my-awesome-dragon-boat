import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

export async function createDragonBoatUser(name: string) {
  const res = await API.post('/api/dragon-boat/users', { name })
  return res.data as { id: number; name: string }
}

export async function submitDragonBoatScore(userName: string, durationMs: number) {
  const res = await API.post('/api/dragon-boat/scores', {
    user_name: userName,
    duration_ms: durationMs,
  })
  return res.data
}

export async function getDragonBoatLeaderboard() {
  const res = await API.get('/api/dragon-boat/leaderboard')
  return res.data as { rank: number; user_name: string; duration_ms: number }[]
}

export interface DragonBoatChallengeFeedItem {
  wall_event_key: string
  wall_event_type: string
  occurred_at: string
  challenger_name: string
  challenged_name: string
  old_rank: number
  new_rank: number
  delta_ms: number
  headline: string
  body: string
  tone: string
  priority: 'high' | 'medium' | 'low'
  scenario: string
}

export async function getDragonBoatChallengeFeed(limit = 5) {
  const res = await API.get('/api/dragon-boat/challenge-feed', { params: { limit } })
  return res.data as DragonBoatChallengeFeedItem[]
}
