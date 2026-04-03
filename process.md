# Process & Implementation Plan

This file details the planned modifications to `game.js` according to the required features.

## 1. Obstacle Reduction
**Goal**: Slightly reduce the number of red obstacles in the arena.

**Plan**:
- Locate the `hazards` array in `game.js`.
- Remove 3 static hazards and 1 moving hazard to thin out the obstacles, reducing clutter and allowing more space for the new objective system.

## 2. Objective System
**Goal**: The player must complete a specific objective within a limited time. Failure results in a complete reset (Game Over).

**Plan**:
- **Objective mechanic**: We will add a "Target Zone" (e.g., a green circular area) that the player must reach. 
- **Timer**: A countdown timer (e.g., 20 seconds) starts. Reaching the target zone adds to the score, resets the timer, and moves the target zone to a new random safe location.
- **Game Over on Timeout**: If the timer hits `0`, a `gameOver()` function is triggered, which resets the score, loop count, clears all clones, and resets the player to the initial state.
- **UI Update**: Display the remaining time clearly on the screen or in the HUD.

## 3. Damage & Death Rules
**Goal**: Differentiate the consequences of taking damage from a clone versus hitting an obstacle.

**Plan**:
- **Hitting a Clone**:
  - The player loses `1 HP`.
  - The game pushes the player away slightly (existing behavior).
  - *No clone is created, and the player does not respawn.*
  - If `HP` reaches `0`, it triggers `gameOver()`.
- **Hitting an Obstacle**:
  - This counts as a "death" but not a failure.
  - A new clone is generated from the player's recent movements.
  - The player respawns at a different location (cycles through `respawnPoints`).
  - The player loses `1 HP`.
  - If `HP` reaches `0` after this, it triggers `gameOver()`.

## 4. Reset Mechanism (Game Over)
**Plan**:
- Create a `gameOver()` function that resets:
  - `player.hp` back to max.
  - Timer and Objective position.
  - The `clones` and `bullets` arrays.
  - `score`, `loopCount`, and `player.recording`.
  - Displays a brief "Game Over" overlay or flashes the screen to give feedback that the game has fully restarted.
