import GameView from './components/GameView'
import { mockGameState } from './mockData'
import './index.css'

function App() {
  return (
    <GameView gameState={mockGameState} />
  )
}

export default App
