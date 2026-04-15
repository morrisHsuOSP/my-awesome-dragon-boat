import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SpeedTypingHomePage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  function handleStart() {
    const name = playerName.trim()
    if (!name) {
      setError('Please enter your name.')
      return
    }
    navigate('/games/speed-typing/play', { state: { playerName: name } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100vh', boxSizing: 'border-box', overflow: 'auto', gap: 24, paddingTop: 32 }}>
      <h1>⌨️ Speed Typing Dragon Boat</h1>
      <p style={{ color: '#a9bfd7' }}>Type programming quotes to race your dragon boat to the finish!</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
        <label>Player name</label>
        <input
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
          placeholder="e.g. Alice"
          maxLength={30}
        />
        {error && <p style={{ color: '#f55' }}>{error}</p>}
        <button style={{ background: '#f0c040', color: '#000', marginTop: 8 }} onClick={handleStart}>
          Start Race
        </button>
        <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/games/speed-typing/leaderboard')}>
          Leaderboard
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
