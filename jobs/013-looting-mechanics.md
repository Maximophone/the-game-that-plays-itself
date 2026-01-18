# Job: Looting Mechanics

**Component**: engine  
**Status**: 🟢 completed

## Context

This is "The Game That Plays Itself". We are adding a new mechanic where killing another agent results in looting their inventory. This creates high-stakes conflict and incentivizes combat for survival.

**Current Behavior**: When an agent hits another and their hunger reaches 0, the target dies. Their inventory is lost effectively.

## Objective

Implement looting logic where the killer gains the victim's inventory.

> [!IMPORTANT]
> The engine version in `src/shared/version.ts` **must** be incremented (e.g., to `0.2.1` or `0.3.0` depending on order) to reflect the new kill/loot logic.

### Requirements

1. **Loot Transfer**:
    - When an agent dies due to a "hit" action, all items in their inventory should be transferred to the killer's inventory.
    - Transfer happens BEFORE the victim's inventory is cleared (on death).

2. **Priority Looting**:
    - If the killer's inventory is partially full, they should prioritize taking **berries** (food) first to ensure survival.
    - Other items (stone, wood) are transferred after berries.

3. **Capacity Constraints**:
    - Items that cannot fit into the killer's inventory (due to slot limits or stack limits) are lost (destroyed).

4. **Conflict Resolution**:
    - If multiple agents hit a target and it dies, the loot should go to the "final blower" (the agent whose hit action moved the hunger to 0 or below).

## Implementation Details (engine/actions.ts)

You will need to update the `hit` action processing block in `computeNextState`:

```diff
  // Find target agent
  for (const [, targetAgent] of newAgents) {
      if (
          targetAgent.isAlive &&
          targetAgent.position.x === targetPos.x &&
          targetAgent.position.y === targetPos.y
      ) {
          targetAgent.hunger = Math.max(0, targetAgent.hunger - state.config.hitDamage);
          if (targetAgent.hunger <= 0) {
              targetAgent.isAlive = false;
+             // TODO: Implement loot transfer to the attacker (agent)
          }
          break;
      }
  }
```

## Files to Modify

- **`src/engine/actions.ts`**: Update the `hit` action logic.
- **`src/engine/helpers.ts`**: Add a utility `transferInventory(from: Agent, to: Agent)` if helpful.

## Acceptance Criteria

- [x] Killing an agent transfers their items to the killer.
- [x] Berries are prioritized if space is limited.
- [x] Killer's inventory obeys slot/stack limits (from Job 012).
- [x] Overlapping hits correctly award loot to the killing blow.
- [x] Engine version incremented in `src/shared/version.ts`.
- [x] All tests pass.

---

## 🎯 Completion Report

Implemented looting mechanics for "The Game That Plays Itself".

### Summary of Changes
- **Loot Transfer**: Added `transferInventory` helper in `helpers.ts` to handle inventory transfer between agents.
- **Priority Looting**: Berries are prioritized during transfer to ensure the killer's survival.
- **Capacity Handing**: Transfer respects the killer's `inventorySize` and stack limits (10 items per slot). Items that don't fit are lost.
- **Combat Integration**: Updated `hit` action logic in `actions.ts` to trigger `transferInventory` when a killing blow is delivered.
- **AI Guidance**: Updated the system prompt in `prompt.ts` to inform AI players about the looting mechanic.
- **Version Bump**: Incremented `ENGINE_VERSION` to `0.2.1`.

### Verification Results
- All tests passed, including a new test case `looting: transfers inventory on kill` in `engine.test.ts`.
- Verified simulation stability with the new mechanics.
