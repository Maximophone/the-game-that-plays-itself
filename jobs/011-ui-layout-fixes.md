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

#### 2. Agent Positioning Alignment

Agents should be precisely centered on their grid cells.

**Fix**:
- Review the CSS `position: absolute` calculation in `Agent.tsx`
- Account for grid gap (1px between cells)
- Account for any container padding/borders
- Use `transform: translate(-50%, -50%)` for centering

#### 3. Fixed Agent Inspector Panel

The inspector should have a dedicated, fixed space in the UI rather than floating.

**New Behavior**:
- Right panel has a dedicated area for the inspector
- Clicking an agent populates this area (doesn't create a floating overlay)
- If no agent is selected, show "Click an agent to inspect"
- Panel scrolls internally if content is too long

## Files Modified

1. **`src/web/src/pages/ReplayViewer.tsx`** — Main layout and grid scaling
2. **`src/web/src/components/GameView.tsx`** — Live view layout alignment
3. **`src/web/src/components/Agent.tsx`** — Precise positioning logic
4. **`src/web/src/components/AgentInspector.tsx`** — Refactored to panel with tabs
5. **`src/web/src/index.css`** — Global layout and component styles
6. **`src/web/src/styles/MainMenu.css`** — Main menu scrolling refinements

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
- **Responsive Grid Scaling**: Dynamic cell size calculation (min 20px) via `ResizeObserver` to fit the viewport.
- **Sidebar Tab System**: Organized Right Panel with tabs for Inspector, Messages, and Shortcuts.
- **Precise Alignment**: Overhauled Agent positioning to perfectly align with grid cells.
- **Premium UX Styling**: Added custom, subtle scrollbars and fixed-header layouts for a more polished feel.

### Decisions & Problem Solving
1.  **Tab Switching Bug**: Fixed a UX bug where turn navigation forced the sidebar back to "Inspector" by moving logic to manual `onClick`.
2.  **Menu Scrolling**: Implemented a flex-based layout for the Main Menu to keep the header fixed while allowing the replay grid to scroll internally.
3.  **Visuals**: Added visual aides like color-coded hunger bars and kept inventory blocks compact based on feedback.

---
