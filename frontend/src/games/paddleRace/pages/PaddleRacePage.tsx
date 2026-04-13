import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { submitPaddleRaceScore } from '../api'

// ─── Constants ───
const CANVAS_W = 640
const CANVAS_H = 700
const BOAT_W = 44
const BOAT_H = 100

// River width: ~3.75 boat widths
const RIVER_W = 170
const LANE_LEFT = (CANVAS_W - RIVER_W) / 2
const LANE_RIGHT = LANE_LEFT + RIVER_W
const LANE_CX = CANVAS_W / 2

const FINISH_DISTANCE = 5000

// Physics
const THRUST = 1.2
const WEAK_THRUST = 0.3
const FRICTION = 0.98
const BACKWARD_FLOW = 0.2
const ROT_ON_SAME = 0.14
const ROT_DECAY = 0.995
const MAX_ROT = (60 * Math.PI) / 180 // 60 degrees
const DRIFT_FACTOR = 0.4
const SWAY_AMP = 0.03
const WALL_DECEL = 0.55
const OBS_DECEL = 0.45
const OBS_SPACING = 350
const OBS_W_MIN = 25
const OBS_W_MAX = 55
const OBS_H = 18
const CURRENT_FORCE = 0.5
const CURRENT_ZONE_LEN = 500
const CURRENT_ZONE_GAP = 500

const BOAT_COLOR = '#c03020'

type Phase = 'ready' | 'countdown' | 'racing' | 'finished'

interface BoatState {
  distance: number
  speed: number
  x: number
  rotation: number
  lastKey: 'left' | 'right' | null
}

interface Splash {
  x: number
  worldY: number
  age: number
  side: number
}

interface Petal {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  rotSpeed: number
  size: number
  alpha: number
}

interface Obstacle {
  x: number
  worldY: number
  w: number
  h: number
}

interface CurrentZone {
  startY: number
  endY: number
  direction: 'left' | 'right'
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// ─── Obstacle generation (deterministic from seed) ───

function generateObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = []
  for (let d = OBS_SPACING; d < FINISH_DISTANCE - 200; d += OBS_SPACING) {
    const seed = d * 7
    const numObs = 1 + Math.floor(seededRand(seed) * 2) // 1-2 per row
    for (let i = 0; i < numObs; i++) {
      const w = OBS_W_MIN + seededRand(seed + i * 13 + 1) * (OBS_W_MAX - OBS_W_MIN)
      const x = LANE_LEFT + 6 + seededRand(seed + i * 13 + 2) * (RIVER_W - w - 12)
      const yOff = seededRand(seed + i * 13 + 3) * 60 - 30
      obstacles.push({ x, worldY: d + yOff, w, h: OBS_H })
    }
  }
  return obstacles
}

function checkObstacleCollision(boat: BoatState, obs: Obstacle): boolean {
  const bcx = boat.x
  const bcy = boat.distance
  const rx = BOAT_W * 0.3
  const ry = BOAT_H * 0.4
  const closestX = Math.max(obs.x, Math.min(bcx, obs.x + obs.w))
  const closestY = Math.max(obs.worldY, Math.min(bcy, obs.worldY + obs.h))
  const dx = (closestX - bcx) / rx
  const dy = (closestY - bcy) / ry
  return (dx * dx + dy * dy) <= 1.0
}

// ─── Current zone generation ───

function generateCurrentZones(): CurrentZone[] {
  const zones: CurrentZone[] = []
  let d = CURRENT_ZONE_GAP
  let dirToggle = false
  while (d + CURRENT_ZONE_LEN < FINISH_DISTANCE - 200) {
    zones.push({
      startY: d,
      endY: d + CURRENT_ZONE_LEN,
      direction: dirToggle ? 'left' : 'right',
    })
    dirToggle = !dirToggle
    d += CURRENT_ZONE_LEN + CURRENT_ZONE_GAP
  }
  return zones
}

function getCurrentForce(boat: BoatState, zones: CurrentZone[]): number {
  for (const z of zones) {
    if (boat.distance >= z.startY && boat.distance <= z.endY) {
      return z.direction === 'right' ? CURRENT_FORCE : -CURRENT_FORCE
    }
  }
  return 0
}

function createBoat(): BoatState {
  return { distance: 0, speed: 0, x: LANE_CX, rotation: 0, lastKey: null }
}

function handlePaddle(boat: BoatState, side: 'left' | 'right') {
  if (boat.lastKey !== side) {
    boat.speed += THRUST
    // Counter-steer: pressing opposite side smoothly reduces rotation
    const counterDir = side === 'left' ? -1 : 1
    boat.rotation += counterDir * 0.12
  } else {
    boat.speed += WEAK_THRUST
    const dir = side === 'left' ? -1 : 1
    boat.rotation += dir * ROT_ON_SAME
    boat.rotation = clamp(boat.rotation, -MAX_ROT, MAX_ROT)
  }
  boat.lastKey = side
}

function updateBoat(boat: BoatState, frame: number) {
  boat.speed *= FRICTION
  const forward = boat.speed * Math.cos(boat.rotation)
  boat.distance += forward
  boat.distance -= BACKWARD_FLOW
  if (boat.distance < 0) boat.distance = 0

  boat.x += boat.speed * Math.sin(boat.rotation) * DRIFT_FACTOR
  boat.x += Math.sin(frame * 0.025 + 7.3) * SWAY_AMP

  boat.rotation *= ROT_DECAY
  if (Math.abs(boat.rotation) < 0.003) boat.rotation = 0

  // Wall collision detection based on rotated bounding box
  const cosR = Math.abs(Math.cos(boat.rotation))
  const sinR = Math.abs(Math.sin(boat.rotation))
  const effectiveHalfW = (BOAT_W * cosR + BOAT_H * sinR) / 2

  const leftEdge = boat.x - effectiveHalfW
  const rightEdge = boat.x + effectiveHalfW

  if (leftEdge < LANE_LEFT) {
    boat.speed *= WALL_DECEL
    boat.x = LANE_LEFT + effectiveHalfW
    boat.rotation *= 0.65
  } else if (rightEdge > LANE_RIGHT) {
    boat.speed *= WALL_DECEL
    boat.x = LANE_RIGHT - effectiveHalfW
    boat.rotation *= 0.65
  }
}

function worldToScreenY(worldDist: number, cameraY: number): number {
  return CANVAS_H - (worldDist - cameraY)
}

// ─── Petal system ───

function initPetals(count: number): Petal[] {
  const petals: Petal[] = []
  for (let i = 0; i < count; i++) {
    petals.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      vx: (Math.random() - 0.3) * 0.7,
      vy: 0.25 + Math.random() * 0.45,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      size: 2 + Math.random() * 3,
      alpha: 0.35 + Math.random() * 0.4,
    })
  }
  return petals
}

function updatePetals(petals: Petal[]) {
  for (const p of petals) {
    p.x += p.vx + Math.sin(p.y * 0.008) * 0.25
    p.y += p.vy
    p.rot += p.rotSpeed
    if (p.y > CANVAS_H + 10) {
      p.y = -10
      p.x = Math.random() * CANVAS_W
    }
    if (p.x < -10) p.x = CANVAS_W + 10
    if (p.x > CANVAS_W + 10) p.x = -10
  }
}

function drawPetals(ctx: CanvasRenderingContext2D, petals: Petal[]) {
  for (const p of petals) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.fillStyle = `rgba(255, 183, 197, ${p.alpha})`
    ctx.beginPath()
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ─── Cherry blossom tree drawing ───

function drawCherryTree(
  ctx: CanvasRenderingContext2D,
  tx: number,
  screenY: number,
  size: number,
  frame: number,
  seed: number,
) {
  if (screenY < -120 || screenY > CANVAS_H + 80) return

  const trunkH = 45 * size
  const trunkW = 7 * size

  // Trunk
  const trunkGrad = ctx.createLinearGradient(tx - trunkW, screenY, tx + trunkW, screenY)
  trunkGrad.addColorStop(0, '#5a3825')
  trunkGrad.addColorStop(0.5, '#7a5035')
  trunkGrad.addColorStop(1, '#5a3825')
  ctx.fillStyle = trunkGrad
  ctx.fillRect(tx - trunkW / 2, screenY - trunkH, trunkW, trunkH)

  // Branches
  ctx.strokeStyle = '#5a3825'
  ctx.lineWidth = 2 * size
  ctx.beginPath()
  ctx.moveTo(tx, screenY - trunkH * 0.7)
  ctx.lineTo(tx - 16 * size, screenY - trunkH - 8 * size)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(tx, screenY - trunkH * 0.55)
  ctx.lineTo(tx + 14 * size, screenY - trunkH - 4 * size)
  ctx.stroke()

  // Canopy: clusters of pink circles
  const pinkShades = ['#ffb7c5', '#ff9bb3', '#ffc8d6', '#ffaec9', '#ff85a2', '#ffd1dc', '#ff7eb3']
  ctx.save()
  for (let c = 0; c < 9; c++) {
    const angle = seededRand(seed + c * 3) * Math.PI * 2
    const dist = (6 + seededRand(seed + c * 7) * 14) * size
    const cx = tx + Math.cos(angle) * dist
    const cy = screenY - trunkH - 2 * size + Math.sin(angle) * dist * 0.65
    const r = (7 + seededRand(seed + c * 11) * 5 + Math.sin(frame * 0.008 + c) * 1) * size
    ctx.fillStyle = pinkShades[c % pinkShades.length]
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // Light bloom center
  ctx.fillStyle = 'rgba(255, 220, 230, 0.3)'
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.arc(tx, screenY - trunkH - 5 * size, 10 * size, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}

// ─── Drawing helpers ───

function drawBanks(ctx: CanvasRenderingContext2D, frame: number, scrollY: number, cameraY: number) {
  // Left bank: grass
  const grassGradL = ctx.createLinearGradient(0, 0, LANE_LEFT, 0)
  grassGradL.addColorStop(0, '#2a6a1a')
  grassGradL.addColorStop(0.7, '#3a8a2a')
  grassGradL.addColorStop(1, '#4a7a20')
  ctx.fillStyle = grassGradL
  ctx.fillRect(0, 0, LANE_LEFT, CANVAS_H)

  // Right bank: grass
  const grassGradR = ctx.createLinearGradient(LANE_RIGHT, 0, CANVAS_W, 0)
  grassGradR.addColorStop(0, '#4a7a20')
  grassGradR.addColorStop(0.3, '#3a8a2a')
  grassGradR.addColorStop(1, '#2a6a1a')
  ctx.fillStyle = grassGradR
  ctx.fillRect(LANE_RIGHT, 0, CANVAS_W - LANE_RIGHT, CANVAS_H)

  // Grass texture dots
  ctx.save()
  ctx.globalAlpha = 0.12
  for (let i = 0; i < 80; i++) {
    const gx = seededRand(i * 3 + 1) * CANVAS_W
    const gy = ((seededRand(i * 3 + 2) * CANVAS_H + scrollY * 18) % (CANVAS_H + 30)) - 15
    // Only draw on banks
    if (gx < LANE_LEFT - 5 || gx > LANE_RIGHT + 5) {
      const shade = seededRand(i * 3 + 3) > 0.5 ? '#1a4a0a' : '#5aaa3a'
      ctx.fillStyle = shade
      ctx.beginPath()
      ctx.arc(gx, gy, 2 + seededRand(i) * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  // Dirt/stone edge near river
  ctx.fillStyle = '#6b5a3a'
  ctx.fillRect(LANE_LEFT - 4, 0, 4, CANVAS_H)
  ctx.fillRect(LANE_RIGHT, 0, 4, CANVAS_H)
  ctx.fillStyle = '#8a7a5a'
  ctx.fillRect(LANE_LEFT - 2, 0, 2, CANVAS_H)
  ctx.fillRect(LANE_RIGHT + 2, 0, 2, CANVAS_H)

  // Cherry blossom trees on both banks
  const treeSpacing = 130
  const visibleStart = cameraY - 150
  const visibleEnd = cameraY + CANVAS_H + 150
  const startIdx = Math.floor(visibleStart / treeSpacing) - 1
  const endIdx = Math.ceil(visibleEnd / treeSpacing) + 1

  for (let i = startIdx; i <= endIdx; i++) {
    // Left bank trees (2 columns)
    for (let col = 0; col < 2; col++) {
      const seed = i * 37 + col * 13
      const worldY = i * treeSpacing + seededRand(seed) * 50 - 25
      const tx = 40 + col * 100 + seededRand(seed + 1) * 60
      if (tx < LANE_LEFT - 15) {
        const sy = worldToScreenY(worldY, cameraY)
        const sz = 0.65 + seededRand(seed + 2) * 0.45
        drawCherryTree(ctx, tx, sy, sz, frame, seed)
      }
    }
    // Right bank trees (2 columns)
    for (let col = 0; col < 2; col++) {
      const seed = i * 41 + col * 19 + 100
      const worldY = i * treeSpacing + seededRand(seed) * 50 - 25
      const tx = LANE_RIGHT + 25 + col * 100 + seededRand(seed + 1) * 60
      if (tx > LANE_RIGHT + 15) {
        const sy = worldToScreenY(worldY, cameraY)
        const sz = 0.65 + seededRand(seed + 2) * 0.45
        drawCherryTree(ctx, tx, sy, sz, frame, seed)
      }
    }
  }
}

function drawWater(ctx: CanvasRenderingContext2D, frame: number, scrollY: number) {
  const grad = ctx.createLinearGradient(LANE_LEFT, 0, LANE_RIGHT, 0)
  grad.addColorStop(0, 'rgb(25, 110, 200)')
  grad.addColorStop(0.5, 'rgb(50, 160, 240)')
  grad.addColorStop(1, 'rgb(25, 110, 200)')
  ctx.fillStyle = grad
  ctx.fillRect(LANE_LEFT, 0, RIVER_W, CANVAS_H)

  // Flowing wave lines (fewer for narrow river)
  ctx.save()
  ctx.globalAlpha = 0.08
  for (let w = 0; w < 3; w++) {
    const baseX = LANE_LEFT + 8 + (w / 3) * (RIVER_W - 16)
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let y = -10; y <= CANVAS_H + 10; y += 3) {
      const sy = y + scrollY * 25
      const wx = baseX + Math.sin(sy * 0.02 + frame * 0.02 + w * 2) * 3
      if (y === -10) ctx.moveTo(wx, y)
      else ctx.lineTo(wx, y)
    }
    ctx.stroke()
  }
  ctx.restore()

  // Sparkles
  ctx.save()
  for (let s = 0; s < 8; s++) {
    const sx = LANE_LEFT + 3 + ((s * 9.7 + frame * 0.35) % (RIVER_W - 6))
    const sy = ((s * 93.3 + frame * 0.6 + scrollY * 18) % CANVAS_H)
    const a = (Math.sin(frame * 0.09 + s * 2.5) + 1) * 0.12
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(sx, sy, 1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Boat image (loaded once, same as Vertical Game)
let boatImg: HTMLImageElement | null = null
let boatImgLoaded = false
;(function loadBoatImg() {
  if (typeof window === 'undefined') return
  const img = new Image()
  img.onload = () => { boatImgLoaded = true }
  img.src = '/games/vertical-game/assets/boat.png'
  boatImg = img
})()

function drawBoatShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rot: number,
  _color: string,
  frame: number,
) {
  const fOff = Math.sin(frame * 0.07) * 1.5

  ctx.save()
  ctx.translate(cx, cy + fOff)
  ctx.rotate(rot)

  if (boatImgLoaded && boatImg) {
    ctx.drawImage(
      boatImg,
      -BOAT_W / 2 - 5, -BOAT_H / 2 - 5,
      BOAT_W + 10, BOAT_H + 10,
    )
  } else {
    // Fallback: simple shape
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(2, 3, BOAT_W / 2 + 3, BOAT_H / 2 + 3, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = _color
    ctx.beginPath()
    ctx.moveTo(0, -BOAT_H / 2)
    ctx.bezierCurveTo(BOAT_W / 2 + 6, -BOAT_H * 0.2, BOAT_W / 2, BOAT_H * 0.3, 3, BOAT_H / 2 + 4)
    ctx.bezierCurveTo(0, BOAT_H / 2 + 6, 0, BOAT_H / 2 + 6, -3, BOAT_H / 2 + 4)
    ctx.bezierCurveTo(-BOAT_W / 2, BOAT_H * 0.3, -BOAT_W / 2 - 6, -BOAT_H * 0.2, 0, -BOAT_H / 2)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

function drawFinishLine(ctx: CanvasRenderingContext2D, screenY: number) {
  if (screenY < -40 || screenY > CANVAS_H + 40) return
  const sq = 10
  const rows = 2
  // Extend across full canvas width for visibility
  for (let row = 0; row < rows; row++) {
    const ny = screenY + row * sq - sq
    const num = Math.ceil(CANVAS_W / sq)
    for (let i = 0; i < num; i++) {
      ctx.fillStyle = (i + row) % 2 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(34,34,34,0.9)'
      ctx.fillRect(i * sq, ny, sq, sq)
    }
  }
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = '#f0c040'
  ctx.textAlign = 'center'
  ctx.fillText('🏁 FINISH 🏁', CANVAS_W / 2, screenY - 20)
  ctx.textAlign = 'left'
}

function drawStartLine(ctx: CanvasRenderingContext2D, screenY: number) {
  if (screenY < -20 || screenY > CANVAS_H + 40) return
  ctx.save()
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = 'rgba(240, 192, 64, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, screenY)
  ctx.lineTo(CANVAS_W, screenY)
  ctx.stroke()
  ctx.restore()
  ctx.font = 'bold 12px sans-serif'
  ctx.fillStyle = 'rgba(240, 192, 64, 0.5)'
  ctx.textAlign = 'center'
  ctx.fillText('START', CANVAS_W / 2, screenY + 16)
  ctx.textAlign = 'left'
}

function drawSplash(ctx: CanvasRenderingContext2D, splash: Splash, cameraY: number) {
  const screenY = worldToScreenY(splash.worldY, cameraY)
  if (screenY < -20 || screenY > CANVAS_H + 20) return
  const progress = splash.age / 18
  const alpha = 0.45 * (1 - progress)
  const r = 3 + progress * 8
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = 'rgba(200, 230, 255, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(splash.x + splash.side * 16, screenY, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  name: string,
  boat: BoatState,
  elapsed: number,
) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(0, 0, CANVAS_W, 44)

  const barW = 260
  const barH = 10
  const barX = (CANVAS_W - barW) / 2
  const barY = 8
  const prog = clamp(boat.distance / FINISH_DISTANCE, 0, 1)

  ctx.fillStyle = '#333'
  ctx.fillRect(barX, barY, barW, barH)
  ctx.fillStyle = BOAT_COLOR
  ctx.fillRect(barX, barY, barW * prog, barH)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  ctx.strokeRect(barX, barY, barW, barH)

  // Boat icon on progress bar
  const iconX = barX + barW * prog
  ctx.fillStyle = '#f0c040'
  ctx.beginPath()
  ctx.moveTo(iconX, barY - 2)
  ctx.lineTo(iconX + 4, barY + barH + 2)
  ctx.lineTo(iconX - 4, barY + barH + 2)
  ctx.closePath()
  ctx.fill()

  ctx.font = 'bold 12px sans-serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(`${name}  —  ${elapsed.toFixed(1)}s  —  ${Math.round(boat.distance)}m / ${FINISH_DISTANCE}m`, CANVAS_W / 2, barY + barH + 16)
  ctx.textAlign = 'left'
}

// ─── Component ───

export default function PaddleRacePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = location as unknown as { state: { playerName: string } }
  const playerName = state?.playerName ?? ''

  useEffect(() => {
    if (!playerName) navigate('/games/paddle-race')
  }, [playerName, navigate])

  const [phase, setPhase] = useState<Phase>('ready')
  const [raceTime, setRaceTime] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const gameRef = useRef({
    phase: 'ready' as Phase,
    boat: createBoat(),
    cameraY: 0,
    scrollOffset: 0,
    frame: 0,
    raceStartTime: 0,
    countdownStart: 0,
    raceTime: 0,
    splashes: [] as Splash[],
    petals: initPetals(40),
    obstacles: generateObstacles(),
    currentZones: generateCurrentZones(),
    hitCooldown: 0,
  })

  function resetGame() {
    gameRef.current = {
      phase: 'countdown',
      boat: createBoat(),
      cameraY: 0,
      scrollOffset: 0,
      frame: 0,
      raceStartTime: 0,
      countdownStart: Date.now(),
      raceTime: 0,
      splashes: [],
      petals: initPetals(40),
      obstacles: generateObstacles(),
      currentZones: generateCurrentZones(),
      hitCooldown: 0,
    }
    setPhase('countdown')
    setRaceTime(0)
  }

  function spawnSplash(boat: BoatState, side: number) {
    const g = gameRef.current
    g.splashes.push({ x: boat.x, worldY: boat.distance, age: 0, side })
  }

  // Key handlers
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const g = gameRef.current

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
      }

      if (g.phase === 'ready' && (e.key === ' ' || e.key === 'Enter')) {
        resetGame()
        return
      }

      if (g.phase !== 'racing') return

      // A or ArrowLeft = left paddle
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        handlePaddle(g.boat, 'left')
        spawnSplash(g.boat, -1)
      }
      // D or ArrowRight = right paddle
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        handlePaddle(g.boat, 'right')
        spawnSplash(g.boat, 1)
      }
    }

    window.addEventListener('keydown', onDown)
    return () => window.removeEventListener('keydown', onDown)
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

      // Countdown
      if (g.phase === 'countdown') {
        const elapsed = (Date.now() - g.countdownStart) / 1000
        if (elapsed >= 3) {
          g.phase = 'racing'
          g.raceStartTime = Date.now()
          setPhase('racing')
        }
      }

      // Racing
      if (g.phase === 'racing') {
        updateBoat(g.boat, g.frame)

        // Current zone force
        const force = getCurrentForce(g.boat, g.currentZones)
        if (force !== 0) {
          g.boat.x += force
        }

        // Obstacle collision
        if (g.hitCooldown > 0) g.hitCooldown--
        if (g.hitCooldown <= 0) {
          for (const obs of g.obstacles) {
            if (checkObstacleCollision(g.boat, obs)) {
              g.boat.speed *= OBS_DECEL
              g.hitCooldown = 30 // cooldown frames to avoid repeated hits
              break
            }
          }
        }

        g.splashes = g.splashes.filter((s: Splash) => {
          s.age++
          return s.age < 18
        })

        // Camera: follow single boat
        const targetCamY = g.boat.distance - CANVAS_H * 0.65
        g.cameraY += (targetCamY - g.cameraY) * 0.07
        if (g.cameraY < -50) g.cameraY = -50

        g.scrollOffset = g.cameraY * 0.01

        // Check finish
        if (g.boat.distance >= FINISH_DISTANCE) {
          g.phase = 'finished'
          g.raceTime = Date.now() - g.raceStartTime
          setPhase('finished')
          setRaceTime(g.raceTime)
          submitPaddleRaceScore(playerName, g.raceTime).catch(() => {})
        }
      }

      // Update petals always (even in non-racing phases for atmosphere)
      updatePetals(g.petals)

      // ─── Draw ───
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      // Water first (under everything)
      drawWater(ctx, g.frame, g.scrollOffset)

      // Current zones (draw under everything else on water)
      for (const zone of g.currentZones) {
        const topSY = worldToScreenY(zone.endY, g.cameraY)
        const botSY = worldToScreenY(zone.startY, g.cameraY)
        if (botSY < -20 || topSY > CANVAS_H + 20) continue
        const drawTop = Math.max(0, topSY)
        const drawBot = Math.min(CANVAS_H, botSY)
        const zoneH = drawBot - drawTop
        if (zoneH <= 0) continue

        // Semi-transparent tint
        ctx.fillStyle = zone.direction === 'right'
          ? 'rgba(80, 180, 255, 0.08)'
          : 'rgba(80, 180, 255, 0.08)'
        ctx.fillRect(LANE_LEFT, drawTop, RIVER_W, zoneH)

        // Arrow indicators
        const arrow = zone.direction === 'right' ? '›' : '‹'
        ctx.font = 'bold 36px sans-serif'
        ctx.fillStyle = zone.direction === 'right'
          ? 'rgba(100, 200, 255, 0.25)'
          : 'rgba(100, 200, 255, 0.25)'
        ctx.textAlign = 'center'
        const arrowSpacingY = 40
        const arrowCols = 3
        const colW = RIVER_W / (arrowCols + 1)
        for (let row = 0; row < Math.ceil(zoneH / arrowSpacingY); row++) {
          const ay = drawTop + row * arrowSpacingY + 20 + Math.sin(g.frame * 0.04 + row) * 3
          if (ay < drawTop || ay > drawBot) continue
          for (let col = 1; col <= arrowCols; col++) {
            const ax = LANE_LEFT + col * colW
            ctx.fillText(arrow, ax, ay)
          }
        }
        ctx.textAlign = 'left'

        // Zone label at top
        const labelY = clamp(topSY + 16, drawTop + 16, drawBot)
        ctx.font = 'bold 10px sans-serif'
        ctx.fillStyle = 'rgba(100, 200, 255, 0.4)'
        ctx.textAlign = 'center'
        const dirLabel = zone.direction === 'right' ? 'CURRENT →' : '← CURRENT'
        ctx.fillText(dirLabel, LANE_CX, labelY)
        ctx.textAlign = 'left'
      }

      // Banks and trees
      drawBanks(ctx, g.frame, g.scrollOffset, g.cameraY)

      // Start line
      const startSY = worldToScreenY(0, g.cameraY)
      drawStartLine(ctx, startSY)

      // Finish line
      const finishSY = worldToScreenY(FINISH_DISTANCE, g.cameraY)
      drawFinishLine(ctx, finishSY)

      // Distance markers
      ctx.font = '9px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      for (let d = 500; d < FINISH_DISTANCE; d += 500) {
        const my = worldToScreenY(d, g.cameraY)
        if (my > 50 && my < CANVAS_H - 10) {
          ctx.textAlign = 'center'
          ctx.fillText(`${d}m`, LANE_CX, my + 3)
          ctx.textAlign = 'left'
        }
      }

      // Obstacles (logs)
      for (const obs of g.obstacles) {
        const osy = worldToScreenY(obs.worldY, g.cameraY)
        if (osy > -30 && osy < CANVAS_H + 30) {
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.15)'
          ctx.beginPath()
          ctx.ellipse(obs.x + obs.w / 2, osy + obs.h + 3, obs.w / 2 + 2, 4, 0, 0, Math.PI * 2)
          ctx.fill()
          // Log body
          ctx.fillStyle = '#6b3a1f'
          ctx.beginPath()
          ctx.roundRect(obs.x, osy, obs.w, obs.h, 5)
          ctx.fill()
          // Wood grain
          ctx.strokeStyle = 'rgba(90, 50, 20, 0.5)'
          ctx.lineWidth = 1
          for (let i = 0; i < 2; i++) {
            const ly = osy + 4 + i * 6
            if (ly < osy + obs.h - 2) {
              ctx.beginPath()
              ctx.moveTo(obs.x + 3, ly)
              ctx.lineTo(obs.x + obs.w - 3, ly)
              ctx.stroke()
            }
          }
          // Log ends
          ctx.fillStyle = '#8b5a2b'
          ctx.beginPath()
          ctx.ellipse(obs.x + 3, osy + obs.h / 2, 3, obs.h / 2 - 1, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.ellipse(obs.x + obs.w - 3, osy + obs.h / 2, 3, obs.h / 2 - 1, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Splashes
      for (const sp of g.splashes) {
        drawSplash(ctx, sp, g.cameraY)
      }

      // Boat
      const screenBY = worldToScreenY(g.boat.distance, g.cameraY)
      drawBoatShape(ctx, g.boat.x, screenBY, g.boat.rotation, BOAT_COLOR, g.frame)

      // Player label
      if (screenBY > 50 && screenBY < CANVAS_H - 20) {
        ctx.font = 'bold 11px sans-serif'
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.fillText(playerName, g.boat.x, screenBY + BOAT_H / 2 + 18)
        ctx.textAlign = 'left'
      }

      // Falling petals (on top of everything except HUD/overlays)
      drawPetals(ctx, g.petals)

      // HUD
      if (g.phase === 'racing' || g.phase === 'finished') {
        const elapsed =
          g.phase === 'racing'
            ? (Date.now() - g.raceStartTime) / 1000
            : g.raceTime / 1000
        drawHUD(ctx, playerName, g.boat, elapsed)
      }

      // ─── Overlays ───

      if (g.phase === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = '#f0c040'
        ctx.textAlign = 'center'
        ctx.fillText('Press SPACE to Start', CANVAS_W / 2, CANVAS_H / 2 - 20)
        ctx.font = '15px sans-serif'
        ctx.fillStyle = '#ccc'
        ctx.fillText('Alternate A/D or ←/→ to paddle', CANVAS_W / 2, CANVAS_H / 2 + 15)
        ctx.font = '13px sans-serif'
        ctx.fillStyle = '#f99'
        ctx.fillText('Same key = weak push + rotation → wall collision slows you down!', CANVAS_W / 2, CANVAS_H / 2 + 45)
        ctx.textAlign = 'left'
      }

      if (g.phase === 'countdown') {
        const elapsed = (Date.now() - g.countdownStart) / 1000
        const remaining = Math.ceil(3 - elapsed)
        const displayText = remaining > 0 ? String(remaining) : 'GO!'
        const scale = remaining > 0 ? 1 + (1 - (elapsed % 1)) * 0.3 : 1.5

        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

        ctx.save()
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2)
        ctx.scale(scale, scale)
        ctx.font = 'bold 72px sans-serif'
        ctx.fillStyle = remaining > 0 ? '#fff' : '#f0c040'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(displayText, 0, 0)
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }

      if (g.phase === 'finished') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 48, CANVAS_W, CANVAS_H - 48)

        ctx.font = 'bold 34px sans-serif'
        ctx.fillStyle = '#f0c040'
        ctx.textAlign = 'center'
        ctx.fillText('🌸 Race Complete! 🌸', CANVAS_W / 2, CANVAS_H / 2 - 30)

        ctx.font = '20px sans-serif'
        ctx.fillStyle = '#fff'
        ctx.fillText(
          `${playerName}  —  ${(g.raceTime / 1000).toFixed(2)}s`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 15,
        )

        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#aaa'
        ctx.fillText('Press SPACE to race again', CANVAS_W / 2, CANVAS_H / 2 + 55)
        ctx.textAlign = 'left'
      }

      animId = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      running = false
      cancelAnimationFrame(animId)
    }
  }, [phase, playerName])

  const timeSec = (raceTime / 1000).toFixed(2)

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px 16px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
          maxWidth: 680,
        }}
      >
        <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)' }}>
          🌸 {playerName}'s Paddle Race
        </h1>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            border: '2px solid #333',
            borderRadius: 6,
            boxShadow: '0 0 24px rgba(255,183,197,0.3)',
            maxWidth: '96vw',
            height: 'auto',
          }}
        />

        {phase === 'finished' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <h2 style={{ color: '#f0c040' }}>🌸 Race Complete!</h2>
            <p>
              Time: <strong>{timeSec}s</strong>
            </p>
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={resetGame}
                style={{
                  background: '#f0c040',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                Race Again
              </button>
              <button
                style={{ background: '#1a3a6a', color: '#fff' }}
                onClick={() => navigate('/games/paddle-race/leaderboard')}
              >
                Leaderboard
              </button>
              <button
                onClick={() => navigate('/')}
                style={{ background: '#24334f', color: '#fff' }}
              >
                Back To Game Hub
              </button>
            </div>
          </div>
        )}

        {phase !== 'finished' && (
          <p style={{ color: '#a9bfd7', textAlign: 'center', fontSize: 14 }}>
            Alternate <strong>A/D</strong> or <strong>←/→</strong> to paddle.
            Same key = weak push + drift. Wall = slow down!
          </p>
        )}
      </div>
    </div>
  )
}
