# Job: Game Mechanics v2 (Food & Inventory)

**Component**: engine, shared, web  
**Status**: 🟢 completed

## Context

This is "The Game That Plays Itself". We are refining the survival mechanics to make the simulation more interesting and strategic.

**Current Issues**:
1. **Infinite Food**: Berry bushes never run out of berries, making survival too trivial.
2. **Constrained Inventory**: Agents can only carry 5 items total, which limits their ability to build or gather diverse resources.

## Objective

Implement food scarcity and a stacked inventory system. 
> [!IMPORTANT]
> The engine version in `src/shared/version.ts` **must** be incremented (e.g., to `0.2.0`) as this changes the game state protocol.

### 1. Food Scarcity (Berry Bushes)

- **Mechanic**: Berry bushes now have a finite capacity.
- **Details**:
    - Each bush starts with a random number of berries (e.g., 5).
    - Every time an agent "gathers" from a bush, the berry count decreases.
    - If the last berry is taken, the bush block is removed from the grid (Cell.block becomes `null`).
- **Data Model update**:
    - Add `berriesRemaining?: number` to the `Cell` interface (or a similar way to track block-specific data).

### 2. Inventory Stacking (Minecraft-style)

- **Mechanic**: Each inventory slot can hold up to 10 instances of the same item.
- **Details**:
    - `inventorySize` (currently 5) defines the number of **slots**.
    - Each slot tracks a `type` and a `count`.
- **Data Model update**:
    - Create an `InventorySlot` interface: `{ type: BlockType; count: number }`.
    - Update `Agent.inventory` to be `InventorySlot[]`.
- **Logic updates**:
    - `gather`: If the gathered item matches an existing slot with space (< 10), increment the count. Otherwise, use a new slot.
    - `build`: Decrement count in the slot. If count reaches 0, remove the slot.
    - `eat`: Decremented count in a "berry" slot.

### 3. UI Updates

- Update the **Agent Inspector** and **Hover Tooltips** to display stacked counts (e.g., "Wood (8)" or "Berry Bush (3 left)").

## Files to Modify

- **`src/shared/types.ts`**: Update `Agent`, `Cell`, and `AgentView` types.
- **`src/engine/state.ts`**: Update resource scattering to initialize berry bush counts.
- **`src/engine/actions.ts`**: Update `gather`, `build`, and `eat` logic.
- **`src/engine/validation.ts`**: Update `inventoryFull` check for stacking logic.
- **`src/web/src/components/AgentInspector.tsx`**: Support stacked inventory display.
- **`src/web/src/components/Grid.tsx`**: Show remaining berries in tooltip if applicable.

## Acceptance Criteria

- [x] Berry bushes are removed after multiple gather actions.
- [x] Agents can carry up to 10 of each item in a single slot.
- [x] Agents can carry up to 5 unique slots (total 50 items if all same).
- [x] UI correctly shows "Item (Count)".
- [x] Building/Eating correctly decrements counts.
- [x] Engine version incremented in `src/shared/version.ts`.
- [x] All tests pass.

---

## 🎯 Completion Report

Implemented Engine v0.2.0 with finite berry bushes and a stacked inventory system (Minecraft-style).

### Summary of Changes
- **Finite Resources**: Berry bushes now spawn with 3-7 berries. Gathering from a bush decrements its count; once empty, the bush is removed from the grid.
- **Stacked Inventory**:
    - Inventory is now an array of `InventorySlot` objects: `{ type: BlockType; count: number }`.
    - Maximum stack size is 10 items per slot.
    - Capacity remains at 5 unique slots.
- **Action Logic**: `gather`, `build`, and `eat` actions are now fully stacking-aware.
- **UI Enhancements**:
    - **Agent Inspector**: Shows item counts in the inventory (e.g., "wood (8)").
    - **Grid Tooltips**: Displays remaining berries on bushes when hovered.
- **Verification**: All 71 tests pass, ensuring protocol compatibility and logic correctness across engine, AI, and CLI components.
