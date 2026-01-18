# Job: Replay Viewer - Main Menu

**Component**: web  
**Status**: 🔴 not started

## Context

This is "The Game That Plays Itself" — our AI-driven 2D sandbox simulation.

**Current State**: The web app displays live game state via WebSocket connection to the server.

**New Architecture**: The web app is becoming a **replay viewer**. Users will:
1. Browse available replay files (this job)
2. Select a replay to watch
3. View playback with navigation controls (Job 009)

This job builds the **main menu** — the entry point where users browse and select replays.

## Objective

Build the main menu UI for the replay viewer.

### Features

1. **List Replays**: Fetch and display all replay files from server
2. **Show Metadata**: Display date, config, status for each replay
3. **Version Warnings**: Highlight replays with engine version mismatches
4. **Navigation**: Click "Watch Replay" to open playback view

### UI Design

```
┌───────────────────────────────────────────────────┐
│  🎮 The Game That Plays Itself - Replay Viewer   │
├───────────────────────────────────────────────────┤
│                                                   │
│  Available Replays                                │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 📁 replay_20260118_103045.json              │ │
│  │ ⚠️  Engine v0.1.0 → Current v0.2.0          │ │
│  │ 🕐 Jan 18, 2026 10:30 AM                    │ │
│  │ 👥 4 agents | 🗺️  20x20 | 🔄 Turn 58 | ✅   │ │
│  │                               [Watch Replay] │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 📁 replay_20260117_154320.json              │ │
│  │ ✓ Engine v0.2.0                              │ │
│  │ 🕐 Jan 17, 2026 3:43 PM                     │ │
│  │ 👥 6 agents | 🗺️  30x30 | 🔄 Turn 142 | ✅  │ │
│  │                               [Watch Replay] │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  No replays? Run: npm run simulate                │
└───────────────────────────────────────────────────┘
```

### Status Indicators

- ✅ Completed (`status: 'completed'`)
- 🔴 Crashed (`status: 'crashed'`)
- 🟡 Running (`status: 'running'`)

### Version Warnings

- Exact match → No warning
- Minor/patch diff → Yellow warning badge
- Major diff → Red warning badge

## Files to Create/Modify

### 1. Server API Endpoints

**File**: `src/server/index.ts`

Add endpoints to serve replay data:

```typescript
app.get('/api/replays', async (req, res) => {
  try {
    const replays = await listReplays(); // from Job 006
    res.json(replays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list replays' });
  }
});

app.get('/api/replays/:filename', async (req, res) => {
  try {
    const replay = await loadReplay(`./replays/${req.params.filename}`);
    res.json(replay);
  } catch (error) {
    res.status(404).json({ error: 'Replay not found' });
  }
});
```

### 2. React Components

**File**: `src/web/src/pages/MainMenu.tsx`

Main menu component that fetches and displays replays.

**File**: `src/web/src/components/ReplayCard.tsx`

Individual card component for each replay (metadata display, click handler).

### 3. Routing

**File**: `src/web/src/App.tsx`

Add React Router routes:
```typescript
<Routes>
  <Route path="/" element={<MainMenu />} />
  <Route path="/replay/:filename" element={<ReplayViewer />} />
</Routes>
```

### 4. Styling

**File**: `src/web/src/styles/MainMenu.css`

Modern card-based layout with:
- Hover effects
- Color-coded status badges
- Responsive design
- Dark theme consistency

### 5. Dependencies

Add to `src/web/package.json`:
```json
{
  "dependencies": {
    "react-router-dom": "^6.20.0"
  }
}
```

## Files to Read

1. **`src/replay/reader.ts`** - (from Job 006) `listReplays()`, `checkCompatibility()`
2. **`src/shared/replay-types.ts`** - (from Job 006) Type definitions
3. **`src/web/src/components/GameView.tsx`** - Current game visualization (will be replaced)
4. **`src/web/src/index.css`** - Existing styles to match

## Acceptance Criteria

- [ ] Main menu lists all available replays
- [ ] Replay cards show metadata (date, config, status, version)
- [ ] Version warnings displayed correctly
- [ ] Clicking "Watch Replay" navigates to `/replay/:filename`
- [ ] Empty state shown when no replays exist
- [ ] Loading state while fetching replays
- [ ] Error handling for failed API calls
- [ ] Responsive UI
- [ ] All tests pass
- [ ] No lint errors

## Notes

**Data Fetching**: Use React hooks (`useEffect`, `useState`) for async data loading.

**Error Handling**: Display user-friendly messages if:
- Server is unreachable
- Replay files are corrupted
- Permissions denied

**Performance**: If listing becomes slow with many replays, consider:
- Pagination
- Virtual scrolling
- Server-side filtering

**Empty State**: Provide helpful message with command to generate replays:
```
No replays found.
Run 'npm run simulate' to create one.
```

**Future Enhancements**:
- Search/filter by date, agent count, status
- Delete replay files from UI
- Sort options (date, turns, status)
- Thumbnails/previews

---

## 🎯 Completion Report

_To be filled by implementer upon completion._
