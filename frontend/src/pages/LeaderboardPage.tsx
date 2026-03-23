import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getLeaderboard } from '../api'

interface Entry {
  rank: number
  user_name: string
  duration_ms: number
}

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { highlight?: string } | null }
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  const highlight = state?.highlight

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 24 }}>
      <h1>🏆 Leaderboard</h1>
      <p style={{ color: '#aaa' }}>Top 10 fastest times (lower = better)</p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: '#f55' }}>{error}</p>}
      {!loading && !error && entries.length === 0 && <p style={{ color: '#aaa' }}>No scores yet. Be the first!</p>}

      {entries.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: 400 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0c040' }}>
              <th style={{ padding: 8, textAlign: 'center', color: '#f0c040' }}>Rank</th>
              <th style={{ padding: 8, textAlign: 'left', color: '#f0c040' }}>Player</th>
              <th style={{ padding: 8, textAlign: 'right', color: '#f0c040' }}>Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr
                key={e.rank}
                style={{
                  borderBottom: '1px solid #1a3a6a',
                  background: e.user_name === highlight ? '#1a3a6a' : 'transparent',
                }}
              >
                <td style={{ padding: 8, textAlign: 'center' }}>
                  {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}
                </td>
                <td style={{ padding: 8 }}>{e.user_name}{e.user_name === highlight ? ' ← you' : ''}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{(e.duration_ms / 1000).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{ background: '#f0c040', color: '#000' }} onClick={() => navigate('/')}>Play Again</button>
      </div>
    </div>
  )
}
