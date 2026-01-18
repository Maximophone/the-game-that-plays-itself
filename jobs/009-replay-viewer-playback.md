# Job: Replay Viewer - Playback Controls

**Component**: web  
**Status**: 🔴 not started

## Context

This is "The Game That Plays Itself" — our AI-driven 2D sandbox simulation.

**Current State**: 
- CLI tool runs simulations and writes replay files (Job 007)
- Main menu lists available replays (Job 008)

**This Job**: Build the playback view where users can watch replays with full navigation controls (forward, backward, seek, auto-play).

## Objective

Build the replay playback viewer with turn-by-turn navigation controls.

### Core Features

1. **Load Replay**: Fetch selected replay file from server
2. **Display Game State**: Show grid, agents, messages at current turn
3. **Navigation Controls**: Forward, backward, seek, first, last
4. **Auto-Play**: Automatically advance turns at configurable speed
5. **Keyboard Shortcuts**: Arrow keys, spacebar for quick navigation

### UI Layout

```
┌───────────────────────────────────────────────────┐
│  ← Back to Menu        replay_20260118_103045     │
├───────────────────────────────────────────────────┤
│                                                   │
│     ┌─────────────────────────────────┐          │
│     │                                 │          │
│     │       GAME GRID                 │          │
│     │   (Same as current GameView)    │          │
│     │                                 │          │
│     └─────────────────────────────────┘          │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  ⏮  ◀  ⏸  ▶  ⏭      Turn 42 / 58       │   │
│  │  [══════════════════════════════]         │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  [Agent Inspector] [Messages Panel]              │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Playback Controls

| Control | Keyboard | Action |
|---------|----------|--------|
| ⏮ First | `Home` | Jump to turn 0 |
| ◀ Previous | `←` | Go back 1 turn |
| ⏸ Pause / ▶ Play | `Space` | Toggle auto-play |
| ▶ Next | `→` | Go forward 1 turn |
| ⏭ Last | `End` | Jump to final turn |
| Progress Bar | Click | Seek to specific turn |

### Auto-Play Behavior

- Speed: 1 turn per second (configurable later)
- Auto-pause at final turn
- Can pause/resume at any time

## Files to Create/Modify

### 1. Replay Viewer Page

**File**: `src/web/src/pages/ReplayViewer.tsx`

Main component that:
- Loads replay file via API
- Manages current turn state
- Handles auto-play timer
- Renders game visualization
- Delegates to playback controls

### 2. Playback Controls Component

**File**: `src/web/src/components/PlaybackControls.tsx`

Controls UI with buttons and progress bar.

### 3. Keyboard Event Handler

Add to `ReplayViewer.tsx`:
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft': handlePrevious(); break;
      case 'ArrowRight': handleNext(); break;
      case ' ': e.preventDefault(); handlePlayPause(); break;
      case 'Home': handleFirst(); break;
      case 'End': handleLast(); break;
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentTurn, isPlaying]);
```

### 4. Styling

**File**: `src/web/src/styles/ReplayViewer.css`

Style the controls:
- Modern button design
- Smooth progress bar
- Disabled states
- Responsive layout

## Component Reuse

Reuse existing game visualization components:
- `<Grid />` - Game grid display
- `<Agent />` - Agent rendering
- `<AgentInspector />` - Agent details panel
- Messages panel logic

The only difference: state comes from `replay.turns[currentTurn]` instead of live WebSocket.

## State Management

```typescript
const [replay, setReplay] = useState<ReplayFile | null>(null);
const [currentTurn, setCurrentTurn] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);

// Derive game state for current turn
const gameState = replay?.turns[currentTurn];

// Auto-play effect
useEffect(() => {
  if (isPlaying && replay) {
    const interval = setInterval(() => {
      setCurrentTurn(prev => {
        if (prev >= replay.turns.length - 1) {
          setIsPlaying(false); // Stop at end
          return prev;
        }
        return prev + 1;
      });
    }, 1000); // 1 second per turn
    return () => clearInterval(interval);
  }
}, [isPlaying, replay]);
```

## Files to Read

1. **`src/web/src/components/GameView.tsx`** - Current game visualization
2. **`src/web/src/components/Grid.tsx`** - Grid rendering
3. **`src/web/src/components/Agent.tsx`** - Agent rendering
4. **`src/web/src/components/AgentInspector.tsx`** - Agent inspector
5. **`src/shared/replay-types.ts`** - (from Job 006) `ReplayFile` type
6. **`src/web/src/pages/MainMenu.tsx`** - (from Job 008) Navigation source

## Acceptance Criteria

- [ ] Replay loads and displays correctly
- [ ] Can navigate turns forward/backward
- [ ] Progress bar accurately shows position
- [ ] Clicking progress bar seeks to turn
- [ ] Play/pause auto-playback works
- [ ] Auto-play stops at final turn
- [ ] Keyboard shortcuts functional
- [ ] Buttons disabled appropriately (e.g., "Previous" at turn 0)
- [ ] Game grid and agents render at each turn
- [ ] "Back to Menu" returns to main menu
- [ ] Loading state while fetching replay
- [ ] Error handling for missing/corrupted files
- [ ] All tests pass
- [ ] No lint errors

## Notes

**Component Reuse**: Extract shared visualization logic into reusable components if `GameView.tsx` and `ReplayViewer.tsx` have significant duplication.

**Performance**: Loading the entire replay file (~5-10MB) into memory is fine for MVP. If files become large, implement lazy loading (fetch turns on demand).

**Edge Cases**:
- Single-turn replay: Disable all navigation
- Corrupted replay: Show error message
- Empty replay: Handle gracefully

**Button States**:
- Disable "Previous" and "First" when `currentTurn === 0`
- Disable "Next" and "Last" when `currentTurn === finalTurn`
- Change "Play" to "Pause" when playing

**Future Enhancements**:
- Playback speed control (0.5x, 1x, 2x, 5x)
- Frame-by-frame stepping (hold arrow key)
- Export video/GIF of replay
- Download replay file
- Share replay (upload to cloud)

---

## 🎯 Completion Report

**Status**: ✅ Complete  
**Date**: 2026-01-18

### What Was Implemented

1. **ReplayViewer.tsx** (`src/web/src/pages/ReplayViewer.tsx`)
   - Loads replay files via `/api/replays/:filename` API
   - Converts serialized agent objects back to Map for GameState compatibility
   - Manages `currentTurn`, `isPlaying` state
   - Auto-play with 1 second interval, auto-stops at final turn
   - Keyboard shortcuts: `←`/`→` for prev/next, `Space` for play/pause, `Home`/`End` for first/last

2. **PlaybackControls.tsx** (`src/web/src/components/PlaybackControls.tsx`)
   - Navigation buttons: First (⏮), Previous (◀), Play/Pause (▶/⏸), Next (▶), Last (⏭)
   - Clickable progress bar with seek functionality
   - Turn counter display
   - Proper disabled states at boundaries

3. **ReplayViewer.css** (`src/web/src/styles/ReplayViewer.css`)
   - Modern dark theme styling matching existing app
   - Gradient play button with shadow effects
   - Smooth progress bar with draggable thumb
   - Responsive layout for mobile
   - Keyboard hints panel

4. **App.tsx** updated to wire `/replay/:filename` route to `ReplayViewer`

### Problems Encountered & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| API returning 500 error | `reader.ts` was converting agents to `Map`, which can't be serialized to JSON | Removed Map conversion - kept agents as objects and let frontend convert |
| Unused import warning | `ReplayTurn` was imported but no longer used after fix | Removed unused import |
| React hook dependency warning | `selectedAgent` in useEffect dependency caused re-render loop | Used functional setState pattern with `prev` to check agent by ID |

### Decisions Taken

- **Agent conversion**: Done in frontend (`turnToGameState`) rather than backend to keep API responses as pure JSON
- **Progress bar**: Used percentage-based positioning for thumb to handle any number of turns
- **Keyboard shortcuts**: Added `e.preventDefault()` to avoid page scrolling on Space/Arrow keys
- **Component reuse**: Reused `Grid`, `Agent`, `AgentInspector` from live view to maintain consistency
- **Messages panel**: Shows messages for current turn only, with turn label in header

### Files Changed

| File | Change |
|------|--------|
| `src/web/src/pages/ReplayViewer.tsx` | NEW - Main replay viewer page |
| `src/web/src/components/PlaybackControls.tsx` | NEW - Playback control bar |
| `src/web/src/styles/ReplayViewer.css` | NEW - Styling |
| `src/web/src/App.tsx` | MODIFIED - Added route |
| `src/replay/reader.ts` | MODIFIED - Fixed JSON serialization bug |

