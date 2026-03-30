const API_BASE = import.meta.env.VITE_API_URL || ''

export async function submitCoOpAnalysis(
  p1Timestamps: number[],
  p2Timestamps: number[]
): Promise<{ analysis: string }> {
  const res = await fetch(`${API_BASE}/api/co-op-challenge/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p1_timestamps: p1Timestamps,
      p2_timestamps: p2Timestamps,
    }),
  })
  if (!res.ok) {
    let detail = 'Analysis request failed. Please try again later.'
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch { /* ignore parse error */ }
    throw new Error(detail)
  }
  return res.json()
}
