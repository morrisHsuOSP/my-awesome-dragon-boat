import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VerticalGameHomePage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  function handleStart() {
    const name = playerName.trim()
    if (!name) {
      setError('Please enter your name.')
      return
    }
    navigate('/games/vertical-game/play', { state: { playerName: name } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100vh', boxSizing: 'border-box', overflow: 'auto', gap: 24, paddingTop: 32 }}>
      <h1>🚣 Vertical River Game</h1>
      <p style={{ color: '#a9bfd7' }}>Steer your boat down the river and dodge the obstacles!</p>
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
          Start Game
        </button>
        <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/games/vertical-game/leaderboard')}>
          Leaderboard
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
