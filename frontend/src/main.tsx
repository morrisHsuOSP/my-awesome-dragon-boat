import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DragonBoatHomePage from './games/dragonBoat/pages/DragonBoatHomePage'
import DragonBoatGamePage from './games/dragonBoat/pages/DragonBoatGamePage'
import DragonBoatLeaderboardPage from './games/dragonBoat/pages/DragonBoatLeaderboardPage'
import SpeedTypingPage from './games/speedTyping/pages/SpeedTypingPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/dragon-boat" element={<DragonBoatHomePage />} />
        <Route path="/games/dragon-boat/play" element={<DragonBoatGamePage />} />
        <Route path="/games/dragon-boat/leaderboard" element={<DragonBoatLeaderboardPage />} />
        <Route path="/games/speed-typing" element={<SpeedTypingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
