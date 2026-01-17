import GameView from './components/GameView'
import { useGameState } from './hooks/useGameState'
import { mockGameState } from './mockData'
import './index.css'

function App() {
  const { gameState, connectionStatus, error } = useGameState();

  // Show mock data while connecting or if there's no state yet
  const displayState = gameState || mockGameState;

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
      <GameView gameState={displayState} connectionStatus={connectionStatus} />
    </div>
  )
}

export default App

