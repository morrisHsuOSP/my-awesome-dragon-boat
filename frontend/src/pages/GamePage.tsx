import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { submitScore } from '../api'

export default function GamePage() {
  const location = useLocation()
  const { state } = location as unknown as { state: { p1: string; p2: string } }
  const params = new URLSearchParams(location.search)
  const p1Name = state?.p1 ?? params.get('p1') ?? ''
  const p2Name = state?.p2 ?? params.get('p2') ?? ''
  const navigate = useNavigate()
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [showButtons, setShowButtons] = useState(false)

  useEffect(() => {
    if (!p1Name || !p2Name) { navigate('/'); return }
  }, [p1Name, p2Name, navigate])

  useEffect(() => {
    // Pass player names to game.js via window
    ;(window as any).__P1_NAME = p1Name
    ;(window as any).__P2_NAME = p2Name

    const script = document.createElement('script')
    script.src = '/game.js?t=' + Date.now()
    document.body.appendChild(script)
    scriptRef.current = script

    const onGameOver = (e: Event) => {
      setShowButtons(true)
      const detail = (e as CustomEvent).detail as { winner: string; duration_ms: number }
      if (detail?.winner) {
        submitScore(detail.winner, detail.duration_ms).catch(() => {})
      }
    }
    document.addEventListener('game-over', onGameOver)

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
      document.removeEventListener('game-over', onGameOver)
      delete (window as any).__P1_NAME
      delete (window as any).__P2_NAME
    }
  }, [p1Name, p2Name])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#1a1a2e',
      gap: 16,
    }}>
      <h1>🐉 {p1Name} vs {p2Name}</h1>
      <canvas
        id="gameCanvas"
        width={1200}
        height={540}
        style={{
          border: '2px solid #333',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 100, 255, 0.3)',
        }}
      />
      {showButtons && (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            style={{ background: '#f0c040', color: '#000', fontWeight: 'bold' }}
            onClick={() => {
              setShowButtons(false)
              document.dispatchEvent(new Event('game-reset'))
            }}
          >
            Race Again
          </button>
          <button
            style={{ background: '#1a3a6a', color: '#fff' }}
            onClick={() => navigate('/leaderboard')}
          >
            View Leaderboard
          </button>
          <button
            style={{ background: '#333', color: '#fff' }}
            onClick={() => navigate('/')}
          >
            Home
          </button>
        </div>
      )}
    </div>
  )
}
