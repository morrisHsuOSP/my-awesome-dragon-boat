import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { submitDragonBoatScore } from '../api'
import styles from './DragonBoatGamePage.module.css'
import { DRAGON_BOAT_EVENTS, type GameOverDetail, type RaceStartDetail } from '../raceEvents'

function formatTime(ms: number) {
  return (ms / 1000).toFixed(2) + 's'
}

export default function DragonBoatGamePage() {
  const location = useLocation()
  const { state } = location as unknown as {
    state?: { p1Email?: string; p2Email?: string; p1?: string; p2?: string }
  }
  const params = new URLSearchParams(location.search)
  const p1Email = state?.p1Email ?? params.get('p1Email') ?? state?.p1 ?? params.get('p1') ?? ''
  const p2Email = state?.p2Email ?? params.get('p2Email') ?? state?.p2 ?? params.get('p2') ?? ''
  const p1Name = p1Email.split('@')[0] || p1Email
  const p2Name = p2Email.split('@')[0] || p2Email
  const navigate = useNavigate()
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const raceStartRef = useRef<number | null>(null)
  const [showButtons, setShowButtons] = useState(false)
  const [timerMs, setTimerMs] = useState(0)
  const [isRaceRunning, setIsRaceRunning] = useState(false)
  const [racePhase, setRacePhase] = useState<'countdown' | 'racing' | 'finished'>('countdown')

  useEffect(() => {
    if (!p1Email || !p2Email) {
      navigate('/games/dragon-boat')
    }
  }, [p1Email, p2Email, navigate])

  useEffect(() => {
    ;(window as any).__P1_NAME = p1Name
    ;(window as any).__P2_NAME = p2Name
    ;(window as any).__P1_USER = p1Email
    ;(window as any).__P2_USER = p2Email
    ;(window as any).__DRAGON_BOAT_EVENTS = DRAGON_BOAT_EVENTS

    const script = document.createElement('script')
    script.src = '/games/dragon-boat/game.js?t=' + Date.now()
    document.body.appendChild(script)
    scriptRef.current = script

    const onRaceStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as RaceStartDetail
      raceStartRef.current = detail?.start_time ?? Date.now()
      setTimerMs(0)
      setShowButtons(false)
      setIsRaceRunning(true)
      setRacePhase('racing')
    }

    const onGameOver = (e: Event) => {
      setShowButtons(true)
      const detail = (e as CustomEvent).detail as GameOverDetail
      setIsRaceRunning(false)
      setRacePhase('finished')
      if (typeof detail?.duration_ms === 'number') {
        setTimerMs(detail.duration_ms)
      }
      if (detail?.winner) {
        const winnerUser = detail.winner === p1Name ? p1Email : detail.winner === p2Name ? p2Email : detail.winner
        submitDragonBoatScore(winnerUser, detail.duration_ms).catch(() => {})
      }
    }

    document.addEventListener(DRAGON_BOAT_EVENTS.RACE_START, onRaceStart)
    document.addEventListener(DRAGON_BOAT_EVENTS.GAME_OVER, onGameOver)

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
      document.removeEventListener(DRAGON_BOAT_EVENTS.RACE_START, onRaceStart)
      document.removeEventListener(DRAGON_BOAT_EVENTS.GAME_OVER, onGameOver)
      delete (window as any).__P1_NAME
      delete (window as any).__P2_NAME
      delete (window as any).__P1_USER
      delete (window as any).__P2_USER
      delete (window as any).__DRAGON_BOAT_EVENTS
    }
  }, [p1Name, p2Name, p1Email, p2Email])

  useEffect(() => {
    if (!isRaceRunning) {
      return
    }

    const timer = setInterval(() => {
      if (raceStartRef.current) {
        setTimerMs(Date.now() - raceStartRef.current)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [isRaceRunning])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dragon Boat Championship</h1>

      <div className={styles.topBar}>
        <div className={styles.timerCard}>
          <div className={styles.timerHeader}>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE
            </span>
            <span className={styles.phaseLabel}>{racePhase === 'countdown' ? 'Countdown' : racePhase === 'racing' ? 'Race Timer' : 'Finished'}</span>
          </div>
          <div className={styles.timeValue}>{racePhase === 'countdown' ? 'Ready...' : formatTime(timerMs)}</div>
        </div>
      </div>

      <canvas
        id="gameCanvas"
        width={1200}
        height={540}
        className={styles.canvas}
      />
      {showButtons && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 12, 24, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              width: 'min(92vw, 480px)',
              background: 'linear-gradient(180deg, rgba(12, 26, 58, 0.96) 0%, rgba(8, 16, 38, 0.96) 100%)',
              border: '1px solid rgba(240, 192, 64, 0.45)',
              borderRadius: 12,
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.42)',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <h2 style={{ color: '#ffd166', margin: 0 }}>🏁 Race Finished!</h2>
            <p style={{ color: '#f0c040', fontSize: 20, margin: 0, fontWeight: 700 }}>
              Time: {formatTime(timerMs)}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                style={{ background: '#f0c040', color: '#000', fontWeight: 'bold' }}
                onClick={() => {
                  setShowButtons(false)
                  setIsRaceRunning(false)
                  setTimerMs(0)
                  setRacePhase('countdown')
                  raceStartRef.current = null
                  document.dispatchEvent(new Event(DRAGON_BOAT_EVENTS.GAME_RESET))
                }}
              >
                Race Again
              </button>
              <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/games/dragon-boat/leaderboard')}>
                View Leaderboard
              </button>
              <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
                Back To Game Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
