# Job: Web Server Integration

**Component**: web  
**Status**: pending

## Context

The server (Job 004) is now providing a WebSocket API at `ws://localhost:3001` that broadcasts the `GameState` every turn.
The web app (Job 002) is currently displaying mock data.

## Objective

Connect the web app to the live server state.

### 1. WebSocket Hook
- Create `src/web/src/hooks/useGameState.ts`.
- Implement a hook that:
    - Connects to `ws://localhost:3001`.
    - Updates local state whenever a new `GameState` arrives.
    - Handles connection/disconnection/errors.
    - Converts the agents object back into a `Map` if necessary (depending on how the server serializes matches).

### 2. Update GameView
- Update `src/web/src/components/GameView.tsx` (or its parent) to use the `useGameState` hook instead of `mockGameState`.
- Add a "Connection Status" indicator (Connected/Disconnected) so the observer knows if they are seeing live data.

### 3. Polish the UI
- Add a "Turns" counter.
- Better display for the messages log (maybe a scrolling list on the side).
- Visual feedback when an agent moves or performs an action (optional but nice).

## Files to Read

1. `src/shared/types.ts`
2. `src/web/src/components/GameView.tsx`
3. `src/server/websocket.ts` (if available, for wire format)

## Acceptance Criteria

- [ ] Web app displays live data from the server.
- [ ] UI updates automatically every time the server finishes a turn.
- [ ] No more dependency on `mockData.ts` for the main view.
- [ ] Connection status is visible.

## Notes

- Remember that `Map` in `GameState.agents` might be serialized as an object `{ "id": agent }` over JSON. You'll need to handle that.
- Keep the dark theme aesthetics.
