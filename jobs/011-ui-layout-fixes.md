# Job: UI Layout and Positioning Fixes

**Component**: web  
**Status**: 🟢 completed

## Context

This is "The Game That Plays Itself" — our AI-driven 2D sandbox simulation with a replay viewer.

The current UI has several layout and positioning issues that hurt usability:

1. **Viewport Overflow**: The UI extends beyond the screen height, and navigating between turns causes the page to scroll, which is disorienting during playback.

2. **Agent Alignment**: The colored squares representing agents are slightly offset from their actual grid positions, making it hard to see exactly which cell an agent occupies.

3. **Floating Inspector Panel**: When clicking an agent, the inspector panel appears as a floating overlay in what seems like a random position. It should have a dedicated, fixed location in the layout.

## Objective

Fix the UI layout to be more stable, predictable, and viewport-contained.

### Requirements

#### 1. Viewport-Contained Layout

The entire UI should fit within the browser viewport without scrolling during normal use.

**Approach**:
- Use CSS `height: 100vh` with `overflow: hidden` on the main container
- Use flexbox or grid to allocate space between components
- Grid and panels should scale/scroll within their allocated space, not the whole page
- Turn navigation should NEVER cause the page to scroll

**Target Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Header / Title Bar                            [H]  │
├─────────────────────────────────────────────────────┤
│                   │                                 │
│                   │                                 │
│    GAME GRID      │    RIGHT PANEL                  │
│    (scrollable    │    - Agent Inspector (fixed)    │
│     if needed)    │    - Messages Panel             │
│                   │                                 │
│                   │                                 │
├─────────────────────────────────────────────────────┤
│    Playback Controls                                │
└─────────────────────────────────────────────────────┘

[H] = fixed header height
Grid = takes remaining vertical space, scrolls internally if too large
Right Panel = fixed width, scrolls internally
Controls = fixed height at bottom
```

#### 2. Agent Positioning Alignment

Agents should be precisely centered on their grid cells.

**Current Issue**: The calculation for agent positioning doesn't account for grid gaps, borders, or container offsets, causing visual misalignment.

**Fix**:
- Review the CSS `position: absolute` calculation in `Agent.tsx`
- Account for grid gap (1px between cells)
- Account for any container padding/borders
- Use `transform: translate(-50%, -50%)` for centering

**Verification**: Place an agent at (0,0), (0,max), (max,0), and (max,max) — they should all be perfectly centered on their cells.

#### 3. Fixed Agent Inspector Panel

The inspector should have a dedicated, fixed space in the UI rather than floating.

**Current Behavior**: Clicking an agent shows an overlay that appears at an unpredictable position based on click location.

**New Behavior**:
- Right panel has a dedicated area for the inspector
- Clicking an agent populates this area (doesn't create a floating overlay)
- If no agent is selected, show "Click an agent to inspect"
- Panel scrolls internally if content is too long

**Layout Considerations**:
- Inspector panel: ~300px wide (or responsive)
- Contains: agent name, stats, inventory, last thought, last action
- Should have visual distinction (card-like styling)

## Files Modified

1. **`src/web/src/pages/ReplayViewer.tsx`** — Main layout and grid scaling
2. **`src/web/src/components/GameView.tsx`** — Live view layout alignment
3. **`src/web/src/components/Agent.tsx`** — Precise positioning logic
4. **`src/web/src/components/AgentInspector.tsx`** — Refactored to panel with tabs
5. **`src/web/src/index.css`** — Global layout and component styles

## Acceptance Criteria

- [x] UI fits within viewport without page scrolling
- [x] Navigating turns does NOT cause page scroll
- [x] Grid scrolls internally if larger than viewport
- [x] Agents are precisely centered on their grid cells at all positions
- [x] Agent inspector has a fixed location in the right panel
- [x] Inspector content scrolls internally if needed
- [x] Layout is responsive (works at different viewport sizes)
- [x] No visual regressions (colors, fonts, spacing intact)
- [x] Works in both replay viewer and live view
- [x] No lint errors

## 🎯 Completion Report

### Summary of Work
Fully refactored the web application UI to enforce viewport containment and improve simulation observability. The layout now adapts to available space using dynamic grid scaling, while keeping supplementary information (Inspector, Messages) organized in a tabbed sidebar.

### Key Features Implemented
- **Responsive Grid Scaling**: Implemented a `ResizeObserver` based logic that automatically shrinks the grid cells (down to 20px) to fit the viewport before enabling scrollbars.
- **Sidebar Tab System**: Introduced a tabbed interface for the right panel to maximize vertical space for the Inspector, Messages list, and Controls/Shortcuts.
- **Precise Alignment**: Overhauled the Agent positioning math to perfectly align with grid cells, accounting for CSS variables and gaps.
- **Enhanced Inspector**: Added visual aids like a health/hunger bar and clearly demarcated status/brain log sections.

### Decisions & Problem Solving
- **UX Fix**: Moved tab-switching logic from `useEffect` to the `Agent.onClick` handler to prevent turn navigation from forcing the user away from their current tab (e.g., Messages).
- **Design**: Opted for a "Fit-to-Viewport" priority to reduce vertigo during fast playback.
- **Flexibility**: Restored compact inventory tags based on user feedback to save vertical space while maintaining the internal scrollability of the panel.

## Notes

**CSS Variables**: Dynamically managed `--cell-size` via JavaScript to maintain synchronization between the board and the agent layer.

---
