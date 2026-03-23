import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { submitScore } from '../api'

const TRACK_WIDTH = 600   // pixels — finish line position
const PADDLE_STEP = 18    // px per valid key press
const KEYS_P1 = ['a', 'd']
const KEYS_P2 = ['j', 'l']

type GameState = 'waiting' | 'running' | 'finished'

export default function GamePage() {
  const location = useLocation()
  const { state } = location as unknown as { state: { p1: string; p2: string } }
  const params = new URLSearchParams(location.search)
  const p1Name = state?.p1 ?? params.get('p1') ?? ''
  const p2Name = state?.p2 ?? params.get('p2') ?? ''
  const navigate = useNavigate()

  const [pos1, setPos1] = useState(0)
  const [pos2, setPos2] = useState(0)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [winner, setWinner] = useState('')
  const [duration, setDuration] = useState(0)

  const startTimeRef = useRef<number>(0)
  const lastKeyRef = useRef<{ p1: string; p2: string }>({ p1: '', p2: '' })
  // Tracks which key was pressed last for each player (must alternate)

  const finishRef = useRef(false)

  const endGame = useCallback(
    async (winnerName: string, durationMs: number) => {
      if (finishRef.current) return
      finishRef.current = true
      setWinner(winnerName)
      setDuration(durationMs)
      setGameState('finished')
      try {
        await submitScore(winnerName, durationMs)
      } catch {
        // score submit failure is non-blocking
      }
    },
    []
  )

  useEffect(() => {
    if (!p1Name || !p2Name) { navigate('/'); return }
  }, [p1Name, p2Name, navigate])

  useEffect(() => {
    if (gameState !== 'running') return

    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase()

      if (KEYS_P1.includes(key)) {
        // Must alternate between A and D
        if (key === lastKeyRef.current.p1) return
        lastKeyRef.current.p1 = key
        setPos1(prev => {
          const next = Math.min(prev + PADDLE_STEP, TRACK_WIDTH)
          if (next >= TRACK_WIDTH) {
            const ms = Date.now() - startTimeRef.current
            endGame(p1Name, ms)
          }
          return next
        })
      }

      if (KEYS_P2.includes(key)) {
        if (key === lastKeyRef.current.p2) return
        lastKeyRef.current.p2 = key
        setPos2(prev => {
          const next = Math.min(prev + PADDLE_STEP, TRACK_WIDTH)
          if (next >= TRACK_WIDTH) {
            const ms = Date.now() - startTimeRef.current
            endGame(p2Name, ms)
          }
          return next
        })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameState, state, endGame])

  function handleStart() {
    finishRef.current = false
    lastKeyRef.current = { p1: '', p2: '' }
    setPos1(0)
    setPos2(0)
    setWinner('')
    setGameState('running')
    startTimeRef.current = Date.now()
  }

  const pct1 = (pos1 / TRACK_WIDTH) * 100
  const pct2 = (pos2 / TRACK_WIDTH) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 32 }}>
      <h1>🐉 Dragon Boat Race</h1>

      {/* Track */}
      <div style={{ width: TRACK_WIDTH, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Player 1 lane */}
        <div>
          <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>{p1Name} <small style={{ color: '#aaa' }}>(A / D)</small></span>
            <span style={{ color: '#aaa' }}>{Math.round(pct1)}%</span>
          </div>
          <div style={{ background: '#1a3a6a', borderRadius: 8, height: 48, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: `${pct1}%`, top: 8, fontSize: 28, transition: 'left 0.1s', transform: 'translateX(-50%)' }}>🐉</div>
            {/* Finish line */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: '#f0c040' }} />
          </div>
        </div>

        {/* Player 2 lane */}
        <div>
          <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>{p2Name} <small style={{ color: '#aaa' }}>(J / L)</small></span>
            <span style={{ color: '#aaa' }}>{Math.round(pct2)}%</span>
          </div>
          <div style={{ background: '#1a3a6a', borderRadius: 8, height: 48, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: `${pct2}%`, top: 8, fontSize: 28, transition: 'left 0.1s', transform: 'translateX(-50%)' }}>🚣</div>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, background: '#f0c040' }} />
          </div>
        </div>
      </div>

      {/* Controls */}
      {gameState === 'waiting' && (
        <button style={{ background: '#f0c040', color: '#000', fontSize: '1.1rem' }} onClick={handleStart}>
          Start Race!
        </button>
      )}

      {gameState === 'running' && (
        <p style={{ color: '#aaa' }}>Paddle fast! Alternate your keys to move.</p>
      )}

      {gameState === 'finished' && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2>🏆 {winner} wins!</h2>
          <p style={{ color: '#aaa' }}>Time: {(duration / 1000).toFixed(2)}s</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={{ background: '#f0c040', color: '#000' }} onClick={handleStart}>Race Again</button>
            <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/leaderboard', { state: { highlight: winner } })}>
              View Leaderboard
            </button>
            <button style={{ background: '#333', color: '#fff' }} onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      )}
    </div>
  )
}
