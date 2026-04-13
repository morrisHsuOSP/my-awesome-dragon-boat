import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DragonBoatChallengeFeedItem, getDragonBoatChallengeFeed, getDragonBoatLeaderboard } from '../api'
import styles from './DragonBoatLeaderboardPage.module.css'

interface Entry {
  rank: number
  user_name: string
  duration_ms: number
}

export default function DragonBoatLeaderboardPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { highlight?: string } | null }
  const [entries, setEntries] = useState<Entry[]>([])
  const [feedItems, setFeedItems] = useState<DragonBoatChallengeFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDragonBoatLeaderboard(), getDragonBoatChallengeFeed(5)])
      .then(([leaderboard, feed]) => {
        setEntries(leaderboard)
        setFeedItems(feed)
      })
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  const highlight = state?.highlight
  const toDisplayName = (value: string) => value.split('@')[0] || value

  const toneClass = (tone: string) => {
    switch (tone) {
      case 'heated': return styles.toneHeated
      case 'tense': return styles.toneTense
      case 'competitive': return styles.toneCompetitive
      default: return styles.toneMomentum
    }
  }

  const scenarioEmoji = (scenario: string) => {
    switch (scenario) {
      case 'podium_upset': return '🏆'
      case 'photo_finish': return '📸'
      case 'close_chase': return '🎯'
      default: return '⚡'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, gap: 18 }}>
      <h1>Dragon Boat Race Leaderboard</h1>

      <div
        style={{
          width: 1200,
          maxWidth: '96vw',
          display: 'flex',
          flexDirection: 'row-reverse',
          flexWrap: 'nowrap',
          gap: 16,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        <section
          style={{
            flex: '1 1 520px',
            minHeight: 430,
            background: 'linear-gradient(140deg, rgba(11,23,45,0.92), rgba(20,45,78,0.88))',
            border: '1px solid #2f5b94',
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#f0c040' }}>Challenge Wall</h2>
            <span style={{ color: '#8cc4ff', fontSize: 12 }}>AI-crafted race drama</span>
          </div>
          {feedItems.length === 0 && !loading && !error && (
            <p style={{ color: '#a9bfd7' }}>No challenge drama yet. Start a race to create one.</p>
          )}
          <div className={styles.wallGrid}>
            {feedItems.map((item, idx) => {
              const dirClass = idx % 2 === 0 ? styles.bubbleLeft : styles.bubbleRight
              return (
                <article key={item.wall_event_key} className={`${styles.bubble} ${toneClass(item.tone)} ${dirClass}`}>
                  <div className={styles.bubbleHeader}>
                    <span className={styles.scenario}>{scenarioEmoji(item.scenario)}</span>
                    <strong className={styles.headline}>{item.headline}</strong>
                    <span className={`${styles.priority} ${item.priority === 'high' ? styles.priorityHigh : styles.priorityMedium}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className={styles.body}>{item.body}</p>
                  <span className={styles.meta}>{new Date(item.occurred_at).toLocaleString()}</span>
                </article>
              )
            })}
          </div>
        </section>

        <section
          style={{
            flex: '1 1 360px',
            minHeight: 430,
            maxWidth: 460,
            background: 'linear-gradient(140deg, rgba(11,23,45,0.92), rgba(20,45,78,0.88))',
            border: '1px solid #2f5b94',
            borderRadius: 14,
            padding: 18,
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 20, color: '#f0c040' }}>Top 10 Board</h2>

          {loading && <p>Loading...</p>}
          {error && <p style={{ color: '#f55' }}>{error}</p>}
          {!loading && !error && entries.length === 0 && <p style={{ color: '#a9bfd7' }}>No scores yet. Be the first.</p>}

          {entries.length > 0 && (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0c040' }}>
                  <th style={{ padding: 8, textAlign: 'center', color: '#f0c040' }}>Rank</th>
                  <th style={{ padding: 8, textAlign: 'left', color: '#f0c040' }}>Player</th>
                  <th style={{ padding: 8, textAlign: 'right', color: '#f0c040' }}>Time (s)</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr
                    key={e.rank}
                    style={{
                      borderBottom: '1px solid #1a3a6a',
                      background: e.user_name === highlight ? '#1a3a6a' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      {e.rank === 1 ? '1' : e.rank === 2 ? '2' : e.rank === 3 ? '3' : e.rank}
                    </td>
                    <td style={{ padding: 8 }}>{toDisplayName(e.user_name)}{e.user_name === highlight ? ' <- you' : ''}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{(e.duration_ms / 1000).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={{ background: '#f0c040', color: '#000' }} onClick={() => navigate('/games/dragon-boat')}>
          Play Again
        </button>
        <button style={{ background: '#24334f', color: '#fff' }} onClick={() => navigate('/')}>
          Back To Game Hub
        </button>
      </div>
    </div>
  )
}
