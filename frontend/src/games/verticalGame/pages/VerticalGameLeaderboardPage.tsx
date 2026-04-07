import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVerticalGameLeaderboard } from '../api'

interface Entry {
  rank: number
  player_name: string
  score: number
  survival_time_ms: number
}

export default function VerticalGameLeaderboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getVerticalGameLeaderboard()
      .then(setEntries)
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 24 }}>
      <h1>🚣 Vertical Game Leaderboard</h1>
      <p style={{ color: '#a9bfd7' }}>Top 10 river runners (highest score)</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#f55' }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ color: '#a9bfd7' }}>No scores yet. Be the first!</p>}

      {entries.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: 520, maxWidth: '95vw' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0c040' }}>
              <th style={{ padding: 8, textAlign: 'center', color: '#f0c040' }}>Rank</th>
              <th style={{ padding: 8, textAlign: 'left', color: '#f0c040' }}>Player</th>
              <th style={{ padding: 8, textAlign: 'right', color: '#f0c040' }}>Score</th>
              <th style={{ padding: 8, textAlign: 'right', color: '#f0c040' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.rank} style={{ borderBottom: '1px solid #1a3a6a' }}>
                <td style={{ padding: 8, textAlign: 'center' }}>{e.rank}</td>
                <td style={{ padding: 8 }}>{e.player_name}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{e.score}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{(e.survival_time_ms / 1000).toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={{ background: '#f0c040', color: '#000' }} onClick={() => navigate('/games/vertical-game')}>
          Play Again
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
