import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPaddleRaceLeaderboard } from '../api'

interface Entry {
  rank: number
  winner_name: string
  race_time_ms: number
}

export default function PaddleRaceLeaderboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPaddleRaceLeaderboard()
      .then(setEntries)
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 24 }}>
      <h1>🏁 Paddle Race Leaderboard</h1>
      <p style={{ color: '#a9bfd7' }}>Top 10 fastest race winners</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#f55' }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ color: '#a9bfd7' }}>No scores yet. Be the first!</p>}

      {entries.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: 460, maxWidth: '95vw' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0c040' }}>
              <th style={{ padding: 8, textAlign: 'center', color: '#f0c040' }}>Rank</th>
              <th style={{ padding: 8, textAlign: 'left', color: '#f0c040' }}>Winner</th>
              <th style={{ padding: 8, textAlign: 'right', color: '#f0c040' }}>Race Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.rank} style={{ borderBottom: '1px solid #1a3a6a' }}>
                <td style={{ padding: 8, textAlign: 'center' }}>{e.rank}</td>
                <td style={{ padding: 8 }}>{e.winner_name}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{(e.race_time_ms / 1000).toFixed(2)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={{ background: '#f0c040', color: '#000' }} onClick={() => navigate('/games/paddle-race')}>
          Play Again
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
