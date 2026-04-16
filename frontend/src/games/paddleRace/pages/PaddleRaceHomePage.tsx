import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PaddleRaceHomePage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  function handleStart() {
    const name = playerName.trim()
    if (!name) {
      setError('Please enter your name.')
      return
    }
    navigate('/games/paddle-race/play', { state: { playerName: name } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100vh', boxSizing: 'border-box', overflow: 'auto', gap: 24, paddingTop: 32 }}>
      <h1>🌸 Paddle Race</h1>
      <p style={{ color: '#a9bfd7', maxWidth: 420, textAlign: 'center' }}>
        Paddle your dragon boat through the narrow cherry blossom river!
        Alternate keys for max speed — same key causes drift. Don't hit the banks!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 340 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 'bold' }}>Player name</label>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
            placeholder="e.g. Alice"
            maxLength={30}
          />
        </div>

        {error && <p style={{ color: '#f55' }}>{error}</p>}

        <p style={{ color: '#999', fontSize: 13, textAlign: 'center' }}>
          Controls: <strong>A / D</strong> or <strong>← / →</strong> to paddle
        </p>

        <button style={{ background: '#f0c040', color: '#000', marginTop: 4, fontWeight: 'bold' }} onClick={handleStart}>
          Start Race
        </button>
        <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/games/paddle-race/leaderboard')}>
          Leaderboard
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
