import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        padding: '32px 20px',
        background: 'radial-gradient(circle at 10% 20%, rgba(43, 89, 163, 0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(28, 59, 111, 0.35), transparent 42%), #0a1628',
      }}
    >
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: 1.2 }}>Your Game Awaits</h1>
      <p style={{ color: '#a9bfd7', maxWidth: 700, textAlign: 'center' }}>
        Pick a challenge and jump right in.
      </p>

      <div style={{ display: 'flex', gap: 18, width: 'min(980px, 100%)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/games/dragon-boat')}
          style={{
            flex: '1 1 320px',
            minHeight: 220,
            textAlign: 'left',
            padding: 24,
            borderRadius: 14,
            background: 'linear-gradient(140deg, #1a3a6a 0%, #113660 45%, #0b2748 100%)',
            color: '#fff',
            border: '1px solid #2f5d9b',
          }}
        >
          <h2 style={{ marginBottom: 10 }}>Dragon Boat Race</h2>
          <p style={{ color: '#d7e6ff', lineHeight: 1.55, fontWeight: 500 }}>
            2-player local race game. Alternate keys to push your dragon boat to the finish line first.
          </p>
        </button>

        <button
          onClick={() => navigate('/games/speed-typing')}
          style={{
            flex: '1 1 320px',
            minHeight: 220,
            textAlign: 'left',
            padding: 24,
            borderRadius: 14,
            background: 'linear-gradient(140deg, #27472a 0%, #1f5f3e 45%, #194832 100%)',
            color: '#fff',
            border: '1px solid #3d7f55',
          }}
        >
          <h2 style={{ marginBottom: 10 }}>Speed Typing Challenge</h2>
          <p style={{ color: '#daf5e4', lineHeight: 1.55, fontWeight: 500 }}>
            Upcoming game mode. Backend and frontend scaffolding are ready for the next feature iteration.
          </p>
        </button>
      </div>
    </div>
  )
}
