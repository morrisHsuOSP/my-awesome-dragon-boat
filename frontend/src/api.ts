import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

export async function createUser(name: string) {
  const res = await API.post('/users', { name })
  return res.data as { id: number; name: string }
}

export async function submitScore(user_name: string, duration_ms: number) {
  const res = await API.post('/scores', { user_name, duration_ms })
  return res.data
}

export async function getLeaderboard() {
  const res = await API.get('/leaderboard')
  return res.data as { rank: number; user_name: string; duration_ms: number }[]
}
