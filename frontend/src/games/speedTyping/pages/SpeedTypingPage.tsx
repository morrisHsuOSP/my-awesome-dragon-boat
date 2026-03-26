import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSpeedTypingStatus, getSpeedTypingLeaderboard } from '../api'

interface TypingEntry {
  rank: number
  player_name: string
  wpm: number
  accuracy: number
}

export default function SpeedTypingPage() {
  const navigate = useNavigate()
  const [statusText, setStatusText] = useState('Loading feature status...')
  const [entries, setEntries] = useState<TypingEntry[]>([])

  useEffect(() => {
    getSpeedTypingStatus()
      .then(data => setStatusText(data.message))
      .catch(() => setStatusText('Backend scaffold is not reachable right now.'))

    getSpeedTypingLeaderboard()
      .then(setEntries)
      .catch(() => setEntries([]))
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(860px, 100%)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1>Speed Typing Challenge</h1>
        <p style={{ color: '#a9bfd7' }}>A new game mode is being prepared. This page and API scaffold are ready for the next development stage.</p>

        <div style={{ border: '1px solid #2b4770', borderRadius: 12, padding: 20, background: 'rgba(20, 38, 66, 0.55)' }}>
          <h2 style={{ marginBottom: 10 }}>Backend Status</h2>
          <p>{statusText}</p>
        </div>

        <div style={{ border: '1px solid #2b4770', borderRadius: 12, padding: 20, background: 'rgba(20, 38, 66, 0.55)' }}>
          <h2 style={{ marginBottom: 10 }}>Early Leaderboard Scaffold</h2>
          {entries.length === 0 && <p style={{ color: '#a9bfd7' }}>No typing records yet.</p>}
          {entries.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2b4770' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px' }}>Player</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px' }}>WPM</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px' }}>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.rank} style={{ borderBottom: '1px solid rgba(43, 71, 112, 0.45)' }}>
                    <td style={{ padding: '8px 4px' }}>{entry.rank}</td>
                    <td style={{ padding: '8px 4px' }}>{entry.player_name}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{entry.wpm}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{entry.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
            Back To Game Hub
          </button>
        </div>
      </div>
    </div>
  )
}
