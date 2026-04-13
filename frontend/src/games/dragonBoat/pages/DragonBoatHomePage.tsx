import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDragonBoatUser } from '../api'

export default function DragonBoatHomePage() {
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')
  const boatEmphasisStyle = {
    color: '#2fa24f',
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    textDecorationThickness: '2px',
  }
  const keyEmphasisStyle = {
    color: '#c03939',
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    textDecorationThickness: '2px',
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  async function handleStart() {
    setError('')
    const email1 = p1.trim().toLowerCase()
    const email2 = p2.trim().toLowerCase()

    if (!email1 || !email2) {
      setError('Both player emails are required.')
      return
    }

    if (!emailPattern.test(email1) || !emailPattern.test(email2)) {
      setError('Please enter valid emails in format xxx@xxx.xx.')
      return
    }

    if (email1 === email2) {
      setError('Player emails must be different.')
      return
    }

    try {
      await Promise.all([createDragonBoatUser(email1), createDragonBoatUser(email2)])
      navigate('/games/dragon-boat/play', { state: { p1Email: email1, p2Email: email2 } })
    } catch {
      setError('Failed to register players. Please try again.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', gap: 24, paddingTop: 48 }}>
      <h1>Dragon Boat Race</h1>
      <div
        style={{
          width: 760,
          maxWidth: '98vw',
          background: '#13243b',
          border: '1px solid #2f4f7a',
          borderRadius: 8,
          padding: '14px 16px',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', fontSize: 20, color: '#f0c040' }}>Instructions</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#d8e8ff', lineHeight: 1.65 }}>
          <li>2-player local race. First to the finish wins.</li>
          <li>Player1 controls the <span style={boatEmphasisStyle}>top boat</span> by keyboard <span style={keyEmphasisStyle}>Left + Right</span> keys.</li>
          <li>Player2 controls the <span style={boatEmphasisStyle}>bottom boat</span> by keyboard <span style={keyEmphasisStyle}>A + D</span> keys.</li>
          <li>"Left + Right" or "A + D" must be pressed in sequence, or the boat will not move forward properly.</li>
          <li>Both players must enter valid email addresses before starting the race.</li>
          <li>After entering the race page, a 5-second countdown will run, and the race starts immediately when it ends.</li>
        </ul>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 420, maxWidth: '95vw' }}>
        <label>Player 1 email (Arrow Left / Arrow Right)</label>
        <input value={p1} onChange={e => setP1(e.target.value)} placeholder="e.g. alice@example.com" maxLength={60} />
        <label>Player 2 email (A / D)</label>
        <input value={p2} onChange={e => setP2(e.target.value)} placeholder="e.g. bob@example.com" maxLength={60} />
        {error && <p style={{ color: '#f55' }}>{error}</p>}
        <button style={{ background: '#f0c040', color: '#000', marginTop: 8 }} onClick={handleStart}>
          Start Race
        </button>
        <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/games/dragon-boat/leaderboard')}>
          Leaderboard
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
