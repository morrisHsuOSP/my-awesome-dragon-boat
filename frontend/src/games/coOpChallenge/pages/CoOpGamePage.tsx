import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { submitCoOpAnalysis } from '../api'

export default function CoOpGamePage() {
  const location = useLocation()
  const { state } = location as unknown as { state: { p1: string; p2: string } }
  const p1Name = state?.p1 ?? ''
  const p2Name = state?.p2 ?? ''
  const navigate = useNavigate()
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [showButtons, setShowButtons] = useState(false)
  const [durationMs, setDurationMs] = useState(0)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    if (!p1Name || !p2Name) {
      navigate('/games/co-op-challenge')
    }
  }, [p1Name, p2Name, navigate])

  useEffect(() => {
    ;(window as any).__P1_NAME = p1Name
    ;(window as any).__P2_NAME = p2Name

    const script = document.createElement('script')
    script.src = '/games/co-op-challenge/game.js?t=' + Date.now()
    document.body.appendChild(script)
    scriptRef.current = script

    const onGameOver = async (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        duration_ms: number
        p1_timestamps: number[]
        p2_timestamps: number[]
      }
      setDurationMs(detail.duration_ms)
      setShowButtons(true)
      setAnalysisLoading(true)
      setAnalysis(null)
      setAnalysisError(null)

      try {
        const result = await submitCoOpAnalysis(p1Name, p2Name, detail.duration_ms, detail.p1_timestamps, detail.p2_timestamps)
        setAnalysis(result.analysis)
      } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : 'Analysis request failed. Please try again later.')
      } finally {
        setAnalysisLoading(false)
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1a1a2e',
        gap: 16,
      }}
    >
      <h1>{p1Name} &amp; {p2Name} — Co-op Challenge</h1>
      <canvas
        id="gameCanvas"
        width={1200}
        height={540}
        style={{
          border: '2px solid #333',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 100, 255, 0.3)',
          maxWidth: '96vw',
          height: 'auto',
        }}
      />

      {showButtons && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8, maxWidth: 640, width: '100%' }}>
          <p style={{ color: '#f0c040', fontSize: 20, margin: 0 }}>
            完成時間: {(durationMs / 1000).toFixed(2)} 秒
          </p>

          {/* AI 分析結果區塊 */}
          <div
            style={{
              background: 'rgba(0, 20, 60, 0.6)',
              border: '1px solid rgba(240, 192, 64, 0.4)',
              borderRadius: 8,
              padding: '16px 20px',
              width: '100%',
              minHeight: 80,
            }}
          >
            <h3 style={{ color: '#f0c040', margin: '0 0 8px 0', fontSize: 16 }}>🤖 AI 合作分析</h3>
            {analysisLoading && <p style={{ color: '#a9bfd7', margin: 0 }}>分析中，請稍候...</p>}
            {analysisError && <p style={{ color: '#f55', margin: 0 }}>{analysisError}</p>}
            {analysis && (
              <p style={{ color: '#e0e8f0', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{analysis}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              style={{ background: '#f0c040', color: '#000', fontWeight: 'bold' }}
              onClick={() => {
                setShowButtons(false)
                setAnalysis(null)
                setAnalysisError(null)
                setDurationMs(0)
                document.dispatchEvent(new Event('game-reset'))
              }}
            >
              再玩一次
            </button>
            <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
              回到首頁
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
