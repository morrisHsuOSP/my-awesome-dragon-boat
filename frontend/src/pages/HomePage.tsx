import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '../api'

export default function HomePage() {
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')

  async function handleStart() {
    setError('')
    const name1 = p1.trim()
    const name2 = p2.trim()
    if (!name1 || !name2) { setError('Both player names are required.'); return }
    if (name1 === name2) { setError('Player names must be different.'); return }
    try {
      await Promise.all([createUser(name1), createUser(name2)])
      navigate('/game', { state: { p1: name1, p2: name2 } })
    } catch {
      setError('Failed to register players. Please try again.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <h1>🐉 Dragon Boat Race</h1>
      <p style={{ color: '#aaa' }}>2-player local race — first to the finish wins!</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        <label>Player 1 name (keys: A / D)</label>
        <input value={p1} onChange={e => setP1(e.target.value)} placeholder="e.g. Alice" maxLength={20} />
        <label>Player 2 name (keys: J / L)</label>
        <input value={p2} onChange={e => setP2(e.target.value)} placeholder="e.g. Bob" maxLength={20} />
        {error && <p style={{ color: '#f55' }}>{error}</p>}
        <button style={{ background: '#f0c040', color: '#000', marginTop: 8 }} onClick={handleStart}>
          Start Race
        </button>
        <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/leaderboard')}>
          Leaderboard
        </button>
      </div>
    </div>
  )
}
