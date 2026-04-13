import { useNavigate } from 'react-router-dom'

/* ── Inline SVG game icons ── */

function DragonBoatIcon() {
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* boat hull */}
      <path d="M10 50 Q15 62 45 62 Q75 62 80 50 L75 52 Q45 58 15 52 Z" fill="#c0392b" />
      {/* dragon head */}
      <circle cx="78" cy="42" r="7" fill="#e67e22" />
      <circle cx="80" cy="40" r="2" fill="#2c3e50" />
      <path d="M82 38 Q88 32 84 28 Q80 34 82 38Z" fill="#e74c3c" />
      {/* dragon body wave */}
      <path d="M20 45 Q30 35 40 45 Q50 55 60 45 Q65 40 75 43" stroke="#27ae60" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* paddle */}
      <line x1="30" y1="38" x2="26" y2="56" stroke="#f1c40f" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="25" cy="57" rx="3" ry="5" fill="#f39c12" transform="rotate(-10 25 57)" />
      <line x1="50" y1="38" x2="46" y2="56" stroke="#f1c40f" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="45" cy="57" rx="3" ry="5" fill="#f39c12" transform="rotate(-10 45 57)" />
      {/* water */}
      <path d="M5 60 Q15 56 25 60 Q35 64 45 60 Q55 56 65 60 Q75 64 85 60" stroke="#3498db" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10" width="80" height="45" rx="5" fill="#2c3e50" stroke="#5d6d7e" strokeWidth="1.5" />
      {/* key rows */}
      {[0, 1, 2].map(row =>
        Array.from({ length: row === 2 ? 5 : 7 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={row === 2 ? 18 + col * 11 : 10 + col * 10.5}
            y={15 + row * 12}
            width={row === 2 ? 9 : 8}
            height={9}
            rx="1.5"
            fill={
              (row === 1 && col === 3) ? '#e74c3c' :
              (row === 0 && col === 5) ? '#3498db' :
              '#7f8c8d'
            }
          />
        ))
      )}
      {/* spacebar */}
      <rect x="22" y="51" width="46" height="6" rx="2" fill="#95a5a6" />
    </svg>
  )
}

function HandshakeIcon() {
  return (
    <svg width="90" height="80" viewBox="0 0 90 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── top boat (blue/teal) ── */}
      <path d="M12 30 Q16 38 40 38 Q64 38 68 30 L62 32 Q40 36 18 32 Z" fill="#1a6b9b" />
      <path d="M12 30 Q16 24 40 24 Q64 24 68 30" fill="none" stroke="#2980b9" strokeWidth="1.5" />
      {/* dragon head top */}
      <circle cx="66" cy="26" r="4" fill="#e67e22" />
      <circle cx="67" cy="25" r="1.2" fill="#2c3e50" />
      <path d="M69 24 Q72 20 70 18" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* paddles top */}
      <line x1="30" y1="24" x2="28" y2="34" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="24" x2="44" y2="34" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" />

      {/* ── bottom boat (red/warm) ── */}
      <path d="M22 50 Q26 58 50 58 Q74 58 78 50 L72 52 Q50 56 28 52 Z" fill="#943126" />
      <path d="M22 50 Q26 44 50 44 Q74 44 78 50" fill="none" stroke="#c0392b" strokeWidth="1.5" />
      {/* dragon head bottom */}
      <circle cx="76" cy="46" r="4" fill="#e67e22" />
      <circle cx="77" cy="45" r="1.2" fill="#2c3e50" />
      <path d="M79 44 Q82 40 80 38" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* paddles bottom */}
      <line x1="40" y1="44" x2="38" y2="54" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" />
      <line x1="56" y1="44" x2="54" y2="54" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" />

      {/* water waves */}
      <path d="M5 62 Q15 58 25 62 Q35 66 45 62 Q55 58 65 62 Q75 66 85 62" stroke="#5dade2" strokeWidth="1.8" fill="none" opacity="0.5" />
      <path d="M8 68 Q18 64 28 68 Q38 72 48 68 Q58 64 68 68 Q78 72 85 68" stroke="#5dade2" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* co-op sparkle / connection */}
      <path d="M45 38 L45 44" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
      <circle cx="45" cy="41" r="3" fill="#f1c40f" opacity="0.3" />
    </svg>
  )
}

function VerticalGameIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* mountain / canyon */}
      <path d="M10 70 L30 25 L40 45 L50 20 L70 70Z" fill="#1a6b4a" />
      <path d="M15 70 L32 35 L40 50 L48 30 L65 70Z" fill="#27ae60" opacity="0.7" />
      {/* river */}
      <path d="M35 70 Q40 55 38 45 Q36 35 40 25 Q44 15 42 5" stroke="#3498db" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M35 70 Q40 55 38 45 Q36 35 40 25 Q44 15 42 5" stroke="#85c1e9" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* small boat */}
      <path d="M36 50 Q40 46 44 50 Z" fill="#e74c3c" />
      <line x1="40" y1="50" x2="40" y2="44" stroke="#f1c40f" strokeWidth="1.5" />
      {/* rocks */}
      <circle cx="33" cy="38" r="3" fill="#5d4e37" />
      <circle cx="47" cy="30" r="2.5" fill="#5d4e37" />
    </svg>
  )
}

function PaddleRaceIcon() {
  return (
    <svg width="80" height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* cherry blossoms */}
      {[
        [15, 12], [55, 8], [70, 18], [25, 22], [60, 28],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5" fill="#f8a5c2" opacity="0.8" />
          <circle cx={cx} cy={cy} r="2" fill="#f7dc6f" />
        </g>
      ))}
      {/* boat hull */}
      <path d="M15 52 Q20 60 40 60 Q60 60 65 52 L60 54 Q40 58 20 54 Z" fill="#8b4513" />
      {/* dragon head */}
      <path d="M62 48 Q68 42 66 38 Q64 42 62 48Z" fill="#e74c3c" />
      <circle cx="65" cy="44" r="3" fill="#e67e22" />
      <circle cx="66" cy="43" r="1" fill="#2c3e50" />
      {/* paddles */}
      <line x1="30" y1="42" x2="27" y2="56" stroke="#daa520" strokeWidth="2" strokeLinecap="round" />
      <line x1="45" y1="42" x2="42" y2="56" stroke="#daa520" strokeWidth="2" strokeLinecap="round" />
      {/* water with pink tint */}
      <path d="M5 62 Q15 58 25 62 Q35 66 45 62 Q55 58 65 62 Q75 66 80 62" stroke="#e8a0bf" strokeWidth="2" fill="none" opacity="0.7" />
      {/* falling petal */}
      <ellipse cx="48" cy="35" rx="3" ry="2" fill="#f8a5c2" opacity="0.6" transform="rotate(30 48 35)" />
    </svg>
  )
}

/* ── Game card data ── */

interface GameCard {
  title: string
  description: string
  route: string
  bg: string
  border: string
  textColor: string
  buttonLabel: string
  buttonBg: string
  icon: React.ReactNode
  ribbon?: string
}

const games: GameCard[] = [
  {
    title: 'Dragon Boat Race',
    description: '2-player local race game. Alternate keys to push your dragon boat to the finish line first.',
    route: '/games/dragon-boat',
    bg: 'linear-gradient(160deg, #1a3a6a 0%, #113660 50%, #0b2748 100%)',
    border: '#2f5d9b',
    textColor: '#d7e6ff',
    buttonLabel: 'PLAY NOW',
    buttonBg: '#1a3a6a',
    icon: <DragonBoatIcon />,
  },
  {
    title: 'Speed Typing Challenge',
    description: 'Upcoming game mode. Backend and frontend scaffolding are ready for the next feature iteration.',
    route: '/games/speed-typing',
    bg: 'linear-gradient(160deg, #27472a 0%, #1f5f3e 50%, #194832 100%)',
    border: '#3d7f55',
    textColor: '#daf5e4',
    buttonLabel: 'PLAY NOW',
    buttonBg: '#27472a',
    icon: <KeyboardIcon />,
  },
  {
    title: 'Co-op Challenge',
    description: '2-player co-op mode. Work together to complete the challenge.',
    route: '/games/co-op-challenge',
    bg: 'linear-gradient(160deg, #4a2a6a 0%, #3b1a5f 50%, #2a1048 100%)',
    border: '#7b4db5',
    textColor: '#e4d7ff',
    buttonLabel: 'PLAY NOW',
    buttonBg: '#4a2a6a',
    icon: <HandshakeIcon />,
  },
  {
    title: 'River Rush',
    description: 'Steer your boat down the river and dodge obstacles. The river gets faster — how long can you survive?',
    route: '/games/vertical-game',
    bg: 'linear-gradient(160deg, #2a4a6a 0%, #1a5f5f 50%, #104848 100%)',
    border: '#3d9b9b',
    textColor: '#d7f5f0',
    buttonLabel: 'PLAY NOW',
    buttonBg: '#1a4a4a',
    icon: <VerticalGameIcon />,
  },
  {
    title: 'Paddle Race',
    description: 'Paddle your dragon boat through a narrow cherry blossom river! Alternate keys for speed — don\'t hit the banks!',
    route: '/games/paddle-race',
    bg: 'linear-gradient(160deg, #6a2a3a 0%, #5f1a2a 50%, #481020 100%)',
    border: '#9b3d5d',
    textColor: '#f5d7e0',
    buttonLabel: 'PLAY NOW',
    buttonBg: '#5f1a2a',
    icon: <PaddleRaceIcon />,
  },
]

/* ── HomePage component ── */

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px 0',
        background: 'radial-gradient(circle at 10% 20%, rgba(43, 89, 163, 0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(28, 59, 111, 0.35), transparent 42%), #0a1628',
      }}
    >
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: 1.2, marginBottom: 8, color: '#fff' }}>
        Your Game Awaits
      </h1>
      <p style={{ color: '#a9bfd7', marginBottom: 36, textAlign: 'center' }}>
        Pick a challenge and jump right in.
      </p>

      {/* Card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 20,
          justifyContent: 'center',
          width: '100%',
          maxWidth: 920,
        }}
      >
        {games.map((game, index) => {
          const gridColumnMap = [
            '1 / 3',  // Dragon Boat Race
            '3 / 5',  // Speed Typing
            '5 / 7',  // Co-op Challenge
            '2 / 4',  // River Rush (centered between col 1-2 and 3-4)
            '4 / 6',  // Paddle Race (centered between col 3-4 and 5-6)
          ]
          return (
          <div
            key={game.route}
            onClick={() => navigate(game.route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(game.route) }}
            style={{
              gridColumn: gridColumnMap[index],
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '20px 18px 16px',
              borderRadius: 14,
              background: game.bg,
              border: `1.5px solid ${game.border}`,
              color: '#fff',
              cursor: 'pointer',
              overflow: 'hidden',
              minHeight: 280,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 8px 24px ${game.border}66`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = ''
            }}
          >
            {/* Ribbon */}
            {game.ribbon && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: -32,
                  background: '#e67e22',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 36px',
                  transform: 'rotate(40deg)',
                  letterSpacing: 1,
                  zIndex: 2,
                }}
              >
                {game.ribbon}
              </div>
            )}

            {/* Title + description + icon area */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, fontStyle: 'italic' }}>
                {game.title}
              </h2>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <p style={{ color: game.textColor, lineHeight: 1.5, fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>
                  {game.description}
                </p>
                <div style={{ flexShrink: 0 }}>
                  {game.icon}
                </div>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate(game.route) }}
              style={{
                alignSelf: 'flex-start',
                marginTop: 14,
                padding: '10px 28px',
                borderRadius: 8,
                background: game.buttonBg,
                color: '#fff',
                border: `1.5px solid ${game.border}`,
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: 0.8,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = game.border }}
              onMouseLeave={(e) => { e.currentTarget.style.background = game.buttonBg }}
            >
              {game.buttonLabel}
            </button>
          </div>
          )
        })}
      </div>
    </div>
  )
}
