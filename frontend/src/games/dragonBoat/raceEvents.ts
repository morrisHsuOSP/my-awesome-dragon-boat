export const DRAGON_BOAT_EVENTS = {
  RACE_START: 'race-start',
  GAME_OVER: 'game-over',
  GAME_RESET: 'game-reset',
  RACE_RESET: 'race-reset',
} as const

export type RaceStartDetail = {
  start_time?: number
}

export type GameOverDetail = {
  winner: string
  duration_ms: number
}
