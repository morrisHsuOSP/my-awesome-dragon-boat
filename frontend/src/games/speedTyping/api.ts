import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

export async function getSpeedTypingStatus() {
  const res = await API.get('/api/speed-typing/status')
  return res.data as { title: string; status: string; message: string }
}

export async function submitSpeedTypingScore(playerName: string, wpm: number, accuracy: number) {
  const res = await API.post('/api/speed-typing/scores', {
    player_name: playerName,
    wpm,
    accuracy,
  })
  return res.data
}

export async function getSpeedTypingLeaderboard() {
  const res = await API.get('/api/speed-typing/leaderboard')
  return res.data as { rank: number; player_name: string; wpm: number; accuracy: number }[]
}
