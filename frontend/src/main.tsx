import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DragonBoatHomePage from './games/dragonBoat/pages/DragonBoatHomePage'
import DragonBoatGamePage from './games/dragonBoat/pages/DragonBoatGamePage'
import DragonBoatLeaderboardPage from './games/dragonBoat/pages/DragonBoatLeaderboardPage'
import SpeedTypingHomePage from './games/speedTyping/pages/SpeedTypingHomePage'
import SpeedTypingPage from './games/speedTyping/pages/SpeedTypingPage'
import SpeedTypingLeaderboardPage from './games/speedTyping/pages/SpeedTypingLeaderboardPage'
import CoOpChallengePage from './games/coOpChallenge/pages/CoOpChallengePage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/dragon-boat" element={<DragonBoatHomePage />} />
        <Route path="/games/dragon-boat/play" element={<DragonBoatGamePage />} />
        <Route path="/games/dragon-boat/leaderboard" element={<DragonBoatLeaderboardPage />} />
        <Route path="/games/speed-typing" element={<SpeedTypingHomePage />} />
        <Route path="/games/speed-typing/play" element={<SpeedTypingPage />} />
        <Route path="/games/speed-typing/leaderboard" element={<SpeedTypingLeaderboardPage />} />
        <Route path="/games/co-op-challenge" element={<CoOpChallengePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
