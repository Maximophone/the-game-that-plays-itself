import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GameView from './components/GameView'
import { useGameState } from './hooks/useGameState'
import { mockGameState } from './mockData'
import MainMenu from './pages/MainMenu'
import ReplayViewer from './pages/ReplayViewer'
import './index.css'

function LiveView() {
  const { gameState, connectionStatus, error } = useGameState();
  const displayState = gameState || mockGameState;

  return (
    <>
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
      <GameView gameState={displayState} connectionStatus={connectionStatus} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/live" element={<LiveView />} />
          <Route path="/replay/:filename" element={<ReplayViewer />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App


