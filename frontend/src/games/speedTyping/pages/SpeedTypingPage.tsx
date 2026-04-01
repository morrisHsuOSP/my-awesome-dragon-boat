import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getSpeedTypingQuotes, submitSpeedTypingScore } from '../api'

interface Quote {
  id: string
  author: string
  en: string
}

// ─── Constants ───
const CANVAS_W = 1000
const CANVAS_H = 200
const SHIP_WIDTH = 100
const SHIP_HEIGHT = 50
const FINISH_X = CANVAS_W - 150
const START_X = 20
const BOAT_Y = 70
const TARGET_CORRECT_KEYS = 150
const STEP_PER_CHAR = (FINISH_X - START_X) / TARGET_CORRECT_KEYS

const WATER_COLORS: [number, number, number][] = [
  [8, 50, 120], [12, 80, 160], [20, 110, 200], [40, 150, 230],
  [80, 180, 245], [110, 200, 255], [80, 180, 245], [40, 150, 230],
  [20, 110, 200], [12, 80, 160], [8, 50, 120],
]

// ─── Canvas drawing helpers (from game.js style) ───

function drawDynamicRiver(ctx: CanvasRenderingContext2D, frame: number) {
  const sectionH = CANVAS_H / WATER_COLORS.length
  for (let i = 0; i < WATER_COLORS.length; i++) {
    const offset = Math.sin(frame * 0.03 + i * 0.6) * 15
    const c = WATER_COLORS[i]
    const pulse = Math.sin(frame * 0.02 + i * 0.4) * 8
    const r = Math.min(255, Math.max(0, c[0] + pulse))
    const g = Math.min(255, Math.max(0, c[1] + pulse))
    const b = Math.min(255, Math.max(0, c[2] + pulse * 0.5))
    ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
    ctx.fillRect(-50 + offset, i * sectionH, CANVAS_W + 100, sectionH + 1)
  }
  // wave lines
  ctx.save()
  ctx.globalAlpha = 0.08
  for (let w = 0; w < 6; w++) {
    const waveY = (w / 6) * CANVAS_H
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let wx = -20; wx <= CANVAS_W + 20; wx += 4) {
      const wy = waveY + Math.sin(wx * 0.02 + frame * 0.04 + w * 1.2) * 6
        + Math.sin(wx * 0.008 + frame * 0.02) * 4
      if (wx === -20) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy)
    }
    ctx.stroke()
  }
  ctx.restore()
  // sparkles
  ctx.save()
  for (let s = 0; s < 15; s++) {
    const sx = ((s * 137.5 + frame * 0.3) % (CANVAS_W + 40)) - 20
    const sy = ((s * 89.3 + frame * 0.15) % CANVAS_H)
    const a = (Math.sin(frame * 0.08 + s * 2.1) + 1) * 0.12
    const sz = 1.5 + Math.sin(frame * 0.06 + s) * 1
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function drawFinishLine(ctx: CanvasRenderingContext2D) {
  const lineX = FINISH_X + SHIP_WIDTH
  const cell = 10
  for (let y = 0; y < CANVAS_H; y += cell) {
    for (let col = 0; col < 2; col++) {
      ctx.fillStyle = ((Math.floor(y / cell) + col) % 2 === 0) ? '#fff' : '#222'
      ctx.fillRect(lineX + col * cell, y, cell, cell)
    }
  }
  ctx.strokeStyle = 'rgba(240,192,64,0.6)'
  ctx.lineWidth = 2
  ctx.strokeRect(lineX, 0, cell * 2, CANVAS_H)
}

// Boat image (loaded once, shared across renders)
let boatImg: HTMLImageElement | null = null
let boatImgLoaded = false
;(function loadBoatImg() {
  if (typeof window === 'undefined') return
  const img = new Image()
  img.onload = () => { boatImgLoaded = true }
  img.src = '/games/speed-typing/assets/boat.png'
  boatImg = img
})()

function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, floatOff: number) {
  const bx = x
  const by = y + floatOff
  if (boatImgLoaded && boatImg) {
    ctx.drawImage(boatImg, bx, by, SHIP_WIDTH, SHIP_HEIGHT)
    return
  }
  // Fallback polygon if image hasn't loaded
  ctx.save()
  ctx.fillStyle = 'rgb(139,69,19)'
  ctx.beginPath()
  ctx.moveTo(bx, by + SHIP_HEIGHT * 0.3)
  ctx.lineTo(bx + SHIP_WIDTH * 0.85, by + SHIP_HEIGHT * 0.1)
  ctx.lineTo(bx + SHIP_WIDTH, by + SHIP_HEIGHT * 0.5)
  ctx.lineTo(bx + SHIP_WIDTH * 0.85, by + SHIP_HEIGHT * 0.9)
  ctx.lineTo(bx, by + SHIP_HEIGHT * 0.7)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  const mastX = bx + SHIP_WIDTH * 0.45
  ctx.beginPath()
  ctx.moveTo(mastX, by + SHIP_HEIGHT * 0.45)
  ctx.lineTo(mastX, by - SHIP_HEIGHT * 0.3)
  ctx.lineTo(mastX + SHIP_WIDTH * 0.25, by + SHIP_HEIGHT * 0.35)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawWake(ctx: CanvasRenderingContext2D, boatX: number, boatY: number, floatOff: number, seed: number) {
  if (boatX <= START_X + 2) return
  ctx.save()
  for (let i = 0; i < 8; i++) {
    const tx = boatX - 10 - i * 12
    if (tx < 0) break
    const ty = boatY + floatOff + Math.sin(seed * 0.12 + i * 0.8) * 3
    const a = 0.3 - i * 0.035
    const r = 3 + i * 1.2
    ctx.fillStyle = `rgba(200,230,255,${Math.max(0, a)})`
    ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

// ─── Component ───

export default function SpeedTypingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = location as unknown as { state: { playerName: string } }
  const playerName = state?.playerName ?? ''

  // Redirect to home if no player name
  useEffect(() => {
    if (!playerName) navigate('/games/speed-typing')
  }, [playerName, navigate])

  // Game state
  const [phase, setPhase] = useState<'loading' | 'playing' | 'finished'>('loading')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [boatX, setBoatX] = useState(START_X)
  const [totalTyped, setTotalTyped] = useState(0)
  const [correctTyped, setCorrectTyped] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animRef = useRef(0)
  const boatXRef = useRef(START_X)

  // Use refs for all game state so the keydown handler never has stale closures
  const gameRef = useRef({
    phase: 'loading' as 'loading' | 'playing' | 'finished',
    quotes: [] as Quote[],
    quoteIdx: 0,
    charIdx: 0,
    boatX: START_X,
    totalTyped: 0,
    correctTyped: 0,
    startTime: 0,
  })

  // Keep refs in sync with state
  useEffect(() => {
    gameRef.current.phase = phase
    gameRef.current.quotes = quotes
    gameRef.current.quoteIdx = quoteIdx
    gameRef.current.charIdx = charIdx
    gameRef.current.boatX = boatX
    gameRef.current.totalTyped = totalTyped
    gameRef.current.correctTyped = correctTyped
    gameRef.current.startTime = startTime
    boatXRef.current = boatX
  })

  // Load quotes on mount and start game
  useEffect(() => {
    if (!playerName) return
    getSpeedTypingQuotes()
      .then(q => {
        if (!q || q.length === 0) { alert('Failed to fetch quotes.'); return }
        setQuotes(q)
        gameRef.current = {
          phase: 'playing',
          quotes: q,
          quoteIdx: 0,
          charIdx: 0,
          boatX: START_X,
          totalTyped: 0,
          correctTyped: 0,
          startTime: 0,
        }
        setPhase('playing')
      })
      .catch(() => alert('Failed to load quotes from server.'))
  }, [playerName])

  // Canvas animation loop
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    let running = true
    const loop = () => {
      if (!running) return
      frameRef.current++
      const f = frameRef.current
      drawDynamicRiver(ctx, f)
      drawFinishLine(ctx)
      const floatEff = Math.sin(f * 0.1) * 3
      drawWake(ctx, boatXRef.current, BOAT_Y + SHIP_HEIGHT * 0.5, floatEff, f)
      drawBoat(ctx, boatXRef.current, BOAT_Y, floatEff)
      animRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [phase])

  // Current quote text (for rendering)
  const currentQuote = quotes[quoteIdx]?.en ?? ''

  // Keyboard handler — registered once, reads from gameRef
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current
      if (g.phase !== 'playing') return
      const quote = g.quotes[g.quoteIdx]?.en
      if (!quote) return
      if (e.key.length !== 1) return

      // Start timing on first keypress
      if (!g.startTime) {
        const now = Date.now()
        setStartTime(now)
        g.startTime = now
      }
      g.totalTyped++
      setTotalTyped(g.totalTyped)

      const expected = quote[g.charIdx]
      if (e.key === expected) {
        g.correctTyped++
        setCorrectTyped(g.correctTyped)

        const newCharIdx = g.charIdx + 1

        // Fixed step: exactly 150 correct keystrokes to finish
        const newBoatX = Math.min(FINISH_X, g.boatX + STEP_PER_CHAR)

        g.boatX = newBoatX
        boatXRef.current = newBoatX
        setBoatX(newBoatX)

        if (newBoatX >= FINISH_X) {
          g.charIdx = newCharIdx
          setCharIdx(newCharIdx)
          setEndTime(Date.now())
          g.phase = 'finished'
          setPhase('finished')
          return
        }

        if (newCharIdx >= quote.length) {
          if (g.quoteIdx + 1 < g.quotes.length) {
            g.quoteIdx++
            g.charIdx = 0
            setQuoteIdx(g.quoteIdx)
            setCharIdx(0)
          } else {
            setEndTime(Date.now())
            g.phase = 'finished'
            setPhase('finished')
          }
        } else {
          g.charIdx = newCharIdx
          setCharIdx(newCharIdx)
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, []) // empty deps — handler reads from refs

  // Submit score when finished
  useEffect(() => {
    if (phase !== 'finished' || !startTime || !endTime) return
    const elapsed = (endTime - startTime) / 1000
    const minutes = elapsed / 60
    const wpm = minutes > 0 ? Math.round(correctTyped / 5 / minutes) : 0
    const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0
    if (playerName) {
      submitSpeedTypingScore(playerName, Math.max(1, wpm), Math.min(100, Math.max(0, accuracy))).catch(() => {})
    }
  }, [phase, startTime, endTime, correctTyped, totalTyped, playerName])

  const restart = () => {
    navigate('/games/speed-typing')
  }

  // Stats
  const elapsed = startTime && endTime ? (endTime - startTime) / 1000 : 0
  const wpm = elapsed > 0 ? Math.round(correctTyped / 5 / (elapsed / 60)) : 0
  const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(1060px, 100%)', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <h1>⌨️ {playerName}'s Typing Race</h1>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            border: '2px solid #333', borderRadius: 4,
            boxShadow: '0 0 20px rgba(0,100,255,0.3)', maxWidth: '96vw', height: 'auto',
          }}
        />

        {/* LOADING */}
        {phase === 'loading' && (
          <p style={{ color: '#a9bfd7' }}>Loading quotes...</p>
        )}

        {/* PLAYING */}
        {phase === 'playing' && currentQuote && (
          <div style={{ width: '100%', maxWidth: 960 }}>
            {/* Quote display */}
            <div style={{
              background: 'rgba(20,38,66,0.7)', border: '1px solid #2b4770', borderRadius: 12,
              padding: '20px 24px', fontFamily: "'Courier New', Courier, monospace", fontSize: 22,
              lineHeight: 1.7, letterSpacing: 0.5, wordBreak: 'break-word', minHeight: 80,
            }}>
              {currentQuote.split('').map((ch, i) => {
                let color = 'rgba(255,255,255,0.35)' // upcoming
                if (i < charIdx) color = '#4cdf7a' // typed correct
                if (i === charIdx) color = '#f0c040' // current
                return (
                  <span key={i} style={{
                    color,
                    textDecoration: i === charIdx ? 'underline' : 'none',
                    fontWeight: i === charIdx ? 'bold' : 'normal',
                    background: i === charIdx ? 'rgba(240,192,64,0.15)' : 'transparent',
                    borderRadius: 2, padding: '0 1px',
                  }}>{ch}</span>
                )
              })}
            </div>
            <p style={{ color: '#a9bfd7', marginTop: 8, textAlign: 'center', fontSize: 14 }}>
              — by <em>{quotes[quoteIdx]?.author}</em>
            </p>
          </div>
        )}

        {/* FINISHED */}
        {phase === 'finished' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <h2 style={{ color: '#ffd700' }}>🏆 Race Complete!</h2>
            <p>Time: <strong>{elapsed.toFixed(2)}s</strong> — WPM: <strong>{wpm}</strong> — Accuracy: <strong>{accuracy}%</strong></p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={restart} style={{ background: '#f0c040', color: '#000', fontWeight: 'bold' }}>
                Race Again
              </button>
              <button style={{ background: '#1a3a6a', color: '#fff' }} onClick={() => navigate('/games/speed-typing/leaderboard')}>
                View Leaderboard
              </button>
              <button onClick={() => navigate('/')} style={{ background: '#24334f', color: '#fff' }}>
                Back To Game Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
