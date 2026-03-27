import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CoOpChallengePage() {
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')

  async function handleStart() {
    setError('')
    const name1 = p1.trim()
    const name2 = p2.trim()

    if (!name1 || !name2) {
      setError('Both player names are required.')
      return
    }

    if (name1 === name2) {
      setError('Player names must be different.')
      return
    }

    navigate('/games/co-op-challenge/play', { state: { p1: name1, p2: name2 } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', gap: 24, paddingTop: 48 }}>
      <h1>Co-op Challenge</h1>
      <p style={{ color: '#a9bfd7' }}>2-player co-op mode. Work together to complete the challenge.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
        <label>Player 1 name</label>
        <input value={p1} onChange={e => setP1(e.target.value)} placeholder="e.g. Alice" maxLength={20} />
        <label>Player 2 name</label>
        <input value={p2} onChange={e => setP2(e.target.value)} placeholder="e.g. Bob" maxLength={20} />
        {error && <p style={{ color: '#f55' }}>{error}</p>}
        <button style={{ background: '#f0c040', color: '#000', marginTop: 8 }} onClick={handleStart}>
          Start Co-op
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
