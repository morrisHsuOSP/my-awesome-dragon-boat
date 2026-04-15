import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { submitVerticalGameScore } from '../api'

// ─── Constants ───
const CANVAS_W = 560
const CANVAS_H = 700
const BOAT_W = 120
const BOAT_H = 140
const BOAT_Y = CANVAS_H - 200 // boat vertical position (fixed on screen)
const RIVER_LEFT = 40
const RIVER_RIGHT = CANVAS_W - 40
const RIVER_W = RIVER_RIGHT - RIVER_LEFT

const OBSTACLE_W = 60
const OBSTACLE_H = 20
const MIN_OBSTACLE_GAP = 90

const INITIAL_SPEED = 2.5
const SPEED_INCREASE = 0.08 // per second
const MAX_SPEED = 12

const BOAT_MOVE_SPEED = 4.5
const BOW_TURN_SPEED = 0.06 // how fast the bow angle follows input
const BOW_RETURN_SPEED = 0.04
const MAX_BOW_ANGLE = 0.35 // radians

const SPAWN_INTERVAL_INITIAL = 60 // frames between obstacle spawns
const SPAWN_INTERVAL_MIN = 18

const WATER_COLORS: [number, number, number][] = [
  [8, 50, 120], [12, 80, 160], [20, 110, 200], [40, 150, 230],
  [80, 180, 245], [110, 200, 255], [80, 180, 245], [40, 150, 230],
  [20, 110, 200], [12, 80, 160],
]

interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  row: number // for staggered patterns
}

// ─── Drawing helpers ───

function drawRiver(ctx: CanvasRenderingContext2D, frame: number, scrollOffset: number) {
  // ── Bright water base with subtle lateral gradient ──
  const waterGrad = ctx.createLinearGradient(RIVER_LEFT, 0, RIVER_RIGHT, 0)
  waterGrad.addColorStop(0, 'rgb(25, 120, 210)')
  waterGrad.addColorStop(0.15, 'rgb(40, 150, 230)')
  waterGrad.addColorStop(0.5, 'rgb(50, 160, 240)')
  waterGrad.addColorStop(0.85, 'rgb(40, 150, 230)')
  waterGrad.addColorStop(1, 'rgb(25, 120, 210)')
  ctx.fillStyle = waterGrad
  ctx.fillRect(RIVER_LEFT, 0, RIVER_W, CANVAS_H)

  // ── Flowing diagonal ripple bands ──
  ctx.save()
  ctx.globalAlpha = 0.06
  const bandSpacing = 28
  const numBands = Math.ceil((CANVAS_H + CANVAS_W) / bandSpacing) + 4
  for (let i = 0; i < numBands; i++) {
    const baseOffset = (i * bandSpacing - (scrollOffset * 40) % bandSpacing) - CANVAS_W
    const pulse = Math.sin(frame * 0.015 + i * 0.5) * 0.03
    ctx.strokeStyle = '#b0dfff'
    ctx.lineWidth = 2 + Math.sin(frame * 0.02 + i * 0.7) * 1
    ctx.beginPath()
    for (let t = 0; t <= CANVAS_H; t += 3) {
      const px = RIVER_LEFT + (t * 0.3) + baseOffset + Math.sin(t * 0.015 + frame * 0.025 + i) * 12
      const py = t
      if (t === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
  ctx.restore()

  // ── Flowing caustic-like light patterns ──
  ctx.save()
  ctx.globalAlpha = 0.04
  for (let i = 0; i < 6; i++) {
    const cx2 = RIVER_LEFT + 20 + ((i * 53.7 + frame * 0.4) % (RIVER_W - 40))
    const cy2 = ((i * 97.3 + scrollOffset * 35 + frame * 0.3) % (CANVAS_H + 60)) - 30
    const rx = 18 + Math.sin(frame * 0.03 + i * 1.7) * 8
    const ry = 25 + Math.cos(frame * 0.025 + i * 2.1) * 10
    ctx.fillStyle = 'rgba(140, 220, 255, 0.6)'
    ctx.beginPath()
    ctx.ellipse(cx2, cy2, rx, ry, frame * 0.005 + i, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // ── Vertical flowing wave lines ──
  ctx.save()
  ctx.globalAlpha = 0.08
  for (let w = 0; w < 7; w++) {
    const baseX = RIVER_LEFT + 15 + (w / 7) * (RIVER_W - 30)
    ctx.strokeStyle = `rgba(180, 230, 255, ${0.4 + Math.sin(frame * 0.02 + w) * 0.2})`
    ctx.lineWidth = 1 + Math.sin(frame * 0.03 + w * 0.8) * 0.5
    ctx.beginPath()
    for (let y = -20; y <= CANVAS_H + 20; y += 3) {
      const shiftedY = y + scrollOffset * 30
      const wx = baseX + Math.sin(shiftedY * 0.018 + frame * 0.025 + w * 1.3) * 6
        + Math.sin(shiftedY * 0.008 + frame * 0.01 + w * 0.7) * 3
      if (y === -20) ctx.moveTo(wx, y)
      else ctx.lineTo(wx, y)
    }
    ctx.stroke()
  }
  ctx.restore()

  // ── Sparkles / light glints ──
  ctx.save()
  for (let s = 0; s < 18; s++) {
    const sx = RIVER_LEFT + 8 + ((s * 37.5 + frame * 0.5) % (RIVER_W - 16))
    const sy = ((s * 89.3 + frame * 0.8 + scrollOffset * 25) % CANVAS_H)
    const a = (Math.sin(frame * 0.1 + s * 2.1) + 1) * 0.15
    const sz = 1.2 + Math.sin(frame * 0.06 + s * 1.3) * 0.8
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(sx, sy, sz, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // ── Foam streaks near banks ──
  ctx.save()
  ctx.globalAlpha = 0.05
  for (let side = 0; side < 2; side++) {
    const bankX = side === 0 ? RIVER_LEFT + 8 : RIVER_RIGHT - 8
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let y = -10; y <= CANVAS_H + 10; y += 3) {
      const fy = y
      const fx = bankX + Math.sin((y + scrollOffset * 30) * 0.025 + frame * 0.03 + side * 3) * 4
      if (y === -10) ctx.moveTo(fx, fy)
      else ctx.lineTo(fx, fy)
    }
    ctx.stroke()
  }
  ctx.restore()

  // ── River banks (brown edges with depth) ──
  const bankGradL = ctx.createLinearGradient(0, 0, RIVER_LEFT, 0)
  bankGradL.addColorStop(0, '#3a2210')
  bankGradL.addColorStop(0.6, '#5a3a1a')
  bankGradL.addColorStop(1, '#6b4a28')
  ctx.fillStyle = bankGradL
  ctx.fillRect(0, 0, RIVER_LEFT, CANVAS_H)

  const bankGradR = ctx.createLinearGradient(RIVER_RIGHT, 0, CANVAS_W, 0)
  bankGradR.addColorStop(0, '#6b4a28')
  bankGradR.addColorStop(0.4, '#5a3a1a')
  bankGradR.addColorStop(1, '#3a2210')
  ctx.fillStyle = bankGradR
  ctx.fillRect(RIVER_RIGHT, 0, CANVAS_W - RIVER_RIGHT, CANVAS_H)

  // Bank texture (horizontal lines flowing down)
  ctx.fillStyle = 'rgba(30, 18, 8, 0.3)'
  for (let y = 0; y < CANVAS_H; y += 14) {
    const offy = ((y + scrollOffset * 12) % (CANVAS_H + 20)) - 10
    ctx.fillRect(3, offy, RIVER_LEFT - 6, 2)
    ctx.fillRect(RIVER_RIGHT + 3, offy, CANVAS_W - RIVER_RIGHT - 6, 2)
  }

  // Grass edge
  const grassGrad = ctx.createLinearGradient(0, 0, 8, 0)
  grassGrad.addColorStop(0, '#2a5a1a')
  grassGrad.addColorStop(1, '#3a7a2a')
  ctx.fillStyle = grassGrad
  ctx.fillRect(0, 0, 7, CANVAS_H)
  const grassGradR = ctx.createLinearGradient(CANVAS_W - 8, 0, CANVAS_W, 0)
  grassGradR.addColorStop(0, '#3a7a2a')
  grassGradR.addColorStop(1, '#2a5a1a')
  ctx.fillStyle = grassGradR
  ctx.fillRect(CANVAS_W - 7, 0, 7, CANVAS_H)
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, frame: number) {
  // Log obstacle - brown with wood texture
  const { x, y, w, h } = obs

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h + 3, w / 2 + 2, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Main log body
  ctx.fillStyle = '#6b3a1f'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 6)
  ctx.fill()

  // Wood grain
  ctx.strokeStyle = 'rgba(90, 50, 20, 0.6)'
  ctx.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    const ly = y + 4 + i * 6
    if (ly < y + h - 2) {
      ctx.beginPath()
      ctx.moveTo(x + 4, ly)
      ctx.lineTo(x + w - 4, ly + Math.sin(frame * 0.01 + i) * 1)
      ctx.stroke()
    }
  }

  // Log ends (circles)
  ctx.fillStyle = '#8b5a2b'
  ctx.beginPath()
  ctx.ellipse(x + 3, y + h / 2, 4, h / 2 - 1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + w - 3, y + h / 2, 4, h / 2 - 1, 0, 0, Math.PI * 2)
  ctx.fill()
}

// Boat image (loaded once)
let boatImg: HTMLImageElement | null = null
let boatImgLoaded = false
;(function loadBoatImg() {
  if (typeof window === 'undefined') return
  const img = new Image()
  img.onload = () => { boatImgLoaded = true }
  img.src = '/games/vertical-game/assets/boat.png'
  boatImg = img
})()

function drawBoat(ctx: CanvasRenderingContext2D, x: number, bowAngle: number, frame: number) {
  const cx = x + BOAT_W / 2
  const cy = BOAT_Y + BOAT_H / 2
  const floatOff = Math.sin(frame * 0.08) * 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(bowAngle)
  ctx.translate(-cx, -cy)

  if (boatImgLoaded && boatImg) {
    ctx.drawImage(boatImg, x - 5, BOAT_Y - 5 + floatOff, BOAT_W + 10, BOAT_H + 10)
  } else {
    // Fallback: simple kayak shape
    ctx.fillStyle = '#d93025'
    ctx.beginPath()
    ctx.moveTo(cx, BOAT_Y + floatOff)
    ctx.quadraticCurveTo(x + BOAT_W + 8, BOAT_Y + BOAT_H * 0.35 + floatOff, cx + 6, BOAT_Y + BOAT_H + floatOff)
    ctx.quadraticCurveTo(cx, BOAT_Y + BOAT_H + 6 + floatOff, cx - 6, BOAT_Y + BOAT_H + floatOff)
    ctx.quadraticCurveTo(x - 8, BOAT_Y + BOAT_H * 0.35 + floatOff, cx, BOAT_Y + floatOff)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

// ─── Collision detection ───
// The dragon boat is a narrow diamond/elliptical shape inside its bounding box.
// Use an elliptical hitbox that matches the visible boat body.
function checkCollision(
  boatX: number, bowAngle: number,
  obs: Obstacle
): boolean {
  // Boat ellipse center
  const bcx = boatX + BOAT_W / 2
  const bcy = BOAT_Y + BOAT_H / 2
  // Ellipse radii — boat is narrow horizontally, tall vertically
  const rx = BOAT_W * 0.28 // horizontal radius (boat body is ~56% of bounding width)
  const ry = BOAT_H * 0.42 // vertical radius (boat body is ~84% of bounding height)

  // Find closest point on obstacle AABB to the ellipse center
  const closestX = Math.max(obs.x, Math.min(bcx, obs.x + obs.w))
  const closestY = Math.max(obs.y, Math.min(bcy, obs.y + obs.h))

  // Normalized distance in ellipse space
  const dx = (closestX - bcx) / rx
  const dy = (closestY - bcy) / ry

  return (dx * dx + dy * dy) <= 1.0
}

// ─── Obstacle spawning ───
function spawnObstacleRow(riverSpeed: number, rowCounter: number): Obstacle[] {
  const obstacles: Obstacle[] = []
  const minGap = Math.max(MIN_OBSTACLE_GAP, BOAT_W + 30) // at least 100px gap
  const usableW = RIVER_W - 10

  // Generate obstacle positions ensuring passable gaps >= 100px
  const positions: { x: number; w: number }[] = []

  // Determine how many obstacles fit with required gaps
  const maxObs = Math.floor((usableW + minGap) / (40 + minGap))
  const numObstacles = Math.max(1, Math.min(1 + Math.floor(Math.random() * 3), maxObs))

  if (numObstacles === 1) {
    const w = OBSTACLE_W + Math.random() * 40
    const maxX = RIVER_LEFT + usableW - w
    const x = RIVER_LEFT + 5 + Math.random() * (maxX - RIVER_LEFT - 5)
    positions.push({ x, w })
  } else {
    // Place obstacles with guaranteed gaps >= MIN_OBSTACLE_GAP
    // Strategy: generate non-overlapping positions with forced gaps
    const obsWidths: number[] = []
    for (let i = 0; i < numObstacles; i++) {
      obsWidths.push(30 + Math.random() * 40)
    }
    const totalObsW = obsWidths.reduce((a, b) => a + b, 0)
    const totalGapNeeded = (numObstacles - 1) * minGap
    const slack = usableW - totalObsW - totalGapNeeded

    if (slack < 0) {
      // Not enough room — just place one obstacle
      const w = OBSTACLE_W + Math.random() * 40
      const maxX = RIVER_LEFT + usableW - w
      const x = RIVER_LEFT + 5 + Math.random() * Math.max(1, maxX - RIVER_LEFT - 5)
      positions.push({ x, w })
    } else {
      // Distribute extra space randomly
      let currentX = RIVER_LEFT + 5 + Math.random() * Math.min(slack, 30)
      for (let i = 0; i < numObstacles; i++) {
        const w = obsWidths[i]
        const clampedX = Math.max(RIVER_LEFT + 5, Math.min(currentX, RIVER_RIGHT - w - 5))
        positions.push({ x: clampedX, w })
        currentX = clampedX + w + minGap + Math.random() * Math.min(slack / numObstacles, 20)
      }
    }
  }

  for (const pos of positions) {
    obstacles.push({
      x: pos.x,
      y: -OBSTACLE_H - Math.random() * 20,
      w: pos.w,
      h: OBSTACLE_H,
      row: rowCounter,
    })
  }

  return obstacles
}

// ─── Component ───

export default function VerticalGamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = location as unknown as { state: { playerName: string } }
  const playerName = state?.playerName ?? ''

  useEffect(() => {
    if (!playerName) navigate('/games/vertical-game')
  }, [playerName, navigate])

  const [phase, setPhase] = useState<'ready' | 'playing' | 'gameover'>('ready')
  const [finalScore, setFinalScore] = useState(0)
  const [finalTime, setFinalTime] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // All mutable game state in a single ref to avoid stale closures
  const gameRef = useRef({
    phase: 'ready' as 'ready' | 'playing' | 'gameover',
    boatX: CANVAS_W / 2 - BOAT_W / 2,
    bowAngle: 0,
    moveDir: 0, // -1 left, 0 none, 1 right
    obstacles: [] as Obstacle[],
    riverSpeed: INITIAL_SPEED,
    scrollOffset: 0,
    frame: 0,
    score: 0,
    startTime: 0,
    endTime: 0,
    spawnTimer: 0,
    rowCounter: 0,
  })

  // Keys held
  const keysRef = useRef({ left: false, right: false })

  // Start game
  function startGame() {
    gameRef.current = {
      phase: 'playing',
      boatX: CANVAS_W / 2 - BOAT_W / 2,
      bowAngle: 0,
      moveDir: 0,
      obstacles: [],
      riverSpeed: INITIAL_SPEED,
      scrollOffset: 0,
      frame: 0,
      score: 0,
      startTime: Date.now(),
      endTime: 0,
      spawnTimer: 0,
      rowCounter: 0,
    }
    keysRef.current = { left: false, right: false }
    setPhase('playing')
  }

  // Key handlers
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true

      // Start game on space/enter from ready state
      if (gameRef.current.phase === 'ready' && (e.key === ' ' || e.key === 'Enter')) {
        startGame()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Main game loop
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    let running = true
    let animId = 0

    const loop = () => {
      if (!running) return
      const g = gameRef.current
      g.frame++

      // ─── Update ───
      if (g.phase === 'playing') {
        const elapsed = (Date.now() - g.startTime) / 1000

        // Increase river speed over time
        g.riverSpeed = Math.min(MAX_SPEED, INITIAL_SPEED + elapsed * SPEED_INCREASE)
        g.scrollOffset += g.riverSpeed * 0.01

        // Move boat left/right
        const keys = keysRef.current
        let dir = 0
        if (keys.left) dir -= 1
        if (keys.right) dir += 1
        g.moveDir = dir

        g.boatX += dir * BOAT_MOVE_SPEED
        // Clamp to river
        g.boatX = Math.max(RIVER_LEFT + 2, Math.min(RIVER_RIGHT - BOAT_W - 2, g.boatX))

        // Bow angle: turns toward movement direction, returns to center
        if (dir !== 0) {
          g.bowAngle += (dir * MAX_BOW_ANGLE - g.bowAngle) * BOW_TURN_SPEED * 3
        } else {
          g.bowAngle *= (1 - BOW_RETURN_SPEED * 3)
          if (Math.abs(g.bowAngle) < 0.01) g.bowAngle = 0
        }
        g.bowAngle = Math.max(-MAX_BOW_ANGLE, Math.min(MAX_BOW_ANGLE, g.bowAngle))

        // Spawn obstacles
        const spawnInterval = Math.max(
          SPAWN_INTERVAL_MIN,
          SPAWN_INTERVAL_INITIAL - elapsed * 0.8
        )
        g.spawnTimer++
        if (g.spawnTimer >= spawnInterval) {
          g.spawnTimer = 0
          g.rowCounter++
          const newObs = spawnObstacleRow(g.riverSpeed, g.rowCounter)
          g.obstacles.push(...newObs)
        }

        // Move obstacles down
        for (const obs of g.obstacles) {
          obs.y += g.riverSpeed
        }

        // Remove off-screen obstacles and count score
        const before = g.obstacles.length
        g.obstacles = g.obstacles.filter((obs: Obstacle) => {
          if (obs.y > CANVAS_H + 20) {
            return false
          }
          return true
        })
        const removed = before - g.obstacles.length
        g.score += removed

        // Check collisions
        for (const obs of g.obstacles) {
          if (checkCollision(g.boatX, g.bowAngle, obs)) {
            g.phase = 'gameover'
            g.endTime = Date.now()
            const survivalTime = g.endTime - g.startTime
            setFinalScore(g.score)
            setFinalTime(survivalTime)
            setPhase('gameover')

            if (playerName) {
              submitVerticalGameScore(playerName, g.score, survivalTime).catch(() => {})
            }
            break
          }
        }
      }

      // ─── Draw ───
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      drawRiver(ctx, g.frame, g.scrollOffset)

      // Draw obstacles
      for (const obs of g.obstacles) {
        drawObstacle(ctx, obs, g.frame)
      }

      // Draw boat
      drawBoat(ctx, g.boatX, g.bowAngle, g.frame)

      // HUD
      if (g.phase === 'playing') {
        const elapsed = ((Date.now() - g.startTime) / 1000).toFixed(1)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, CANVAS_W, 36)
        ctx.font = 'bold 16px monospace'
        ctx.fillStyle = '#fff'
        ctx.fillText(`Score: ${g.score}`, 12, 24)
        ctx.fillText(`Time: ${elapsed}s`, CANVAS_W / 2 - 40, 24)
        ctx.fillText(`Speed: ${g.riverSpeed.toFixed(1)}`, CANVAS_W - 110, 24)
      }

      // Ready overlay
      if (g.phase === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = '#f0c040'
        ctx.textAlign = 'center'
        ctx.fillText('Press SPACE to Start', CANVAS_W / 2, CANVAS_H / 2 - 10)
        ctx.font = '16px sans-serif'
        ctx.fillStyle = '#ccc'
        ctx.fillText('Use ← → or A/D to steer', CANVAS_W / 2, CANVAS_H / 2 + 25)
        ctx.textAlign = 'left'
      }

      // Game over overlay
      if (g.phase === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.font = 'bold 32px sans-serif'
        ctx.fillStyle = '#ff4444'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 30)
        ctx.font = '18px sans-serif'
        ctx.fillStyle = '#fff'
        ctx.fillText(`Score: ${g.score}`, CANVAS_W / 2, CANVAS_H / 2 + 10)
        const t = ((g.endTime - g.startTime) / 1000).toFixed(1)
        ctx.fillText(`Survived: ${t}s`, CANVAS_W / 2, CANVAS_H / 2 + 40)
        ctx.textAlign = 'left'
      }

      animId = requestAnimationFrame(loop)
    }
    loop()
    return () => { running = false; cancelAnimationFrame(animId) }
  }, [phase, playerName])

  const survivalSec = (finalTime / 1000).toFixed(2)

  return (
    <div style={{ height: '100vh', padding: '16px 16px', display: 'flex', justifyContent: 'center', boxSizing: 'border-box', overflow: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', maxWidth: 600 }}>
        <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)' }}>🚣 {playerName}'s River Run</h1>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            border: '2px solid #333',
            borderRadius: 6,
            boxShadow: '0 0 24px rgba(0,100,255,0.3)',
            maxWidth: '96vw',
            maxHeight: 'calc(100vh - 120px)',
            height: 'auto',
          }}
        />

        {phase === 'gameover' && (
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
              <h2 style={{ color: '#ffa040', margin: 0 }}>💥 Crashed!</h2>
              <p style={{ color: '#e0e8f0', margin: 0, fontSize: 18 }}>
                Score: <strong>{finalScore}</strong> — Survived: <strong>{survivalSec}s</strong>
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={startGame} style={{ background: '#f0c040', color: '#000', fontWeight: 'bold' }}>
                  Play Again
                </button>
                <button
                  style={{ background: '#1a3a6a', color: '#fff' }}
                  onClick={() => navigate('/games/vertical-game/leaderboard')}
                >
                  Leaderboard
                </button>
                <button onClick={() => navigate('/')} style={{ background: '#24334f', color: '#fff' }}>
                  Back To Game Hub
                </button>
              </div>
            </div>
          </div>
        )}

        {phase !== 'gameover' && (
          <p style={{ color: '#a9bfd7', textAlign: 'center', fontSize: 14 }}>
            Dodge the logs! Use ← → or A / D to steer your boat.
          </p>
        )}
      </div>
    </div>
  )
}
