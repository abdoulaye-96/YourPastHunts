# Death Loop: Your Past Hunts You

A fast-paced action survival game based on a time-loop mechanic where you fight against your own past actions as hostile ghost clones.

## Gameplay

- Move with WASD or Arrow keys
- Attack with Space
- Dash with Shift
- Survive as long as possible against increasing numbers of clones
- Each death creates a new clone that replays your past run
- **Death conditions**: 
  - Hit by clone bullets (lose 1 HP)
  - Direct contact with clones (lose 1 HP)
  - Touching environmental hazards (lose 1 HP)
  - Player has 3 HP total

## How to Play

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, etc.)
2. The game starts immediately
3. Try to survive as long as possible
4. Your score increases with time survived

## Features

- Time-loop mechanic with ghost clones
- Increasing difficulty with more clones
- Simple controls: movement, attack, dash
- Score based on survival time
- Loop counter

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- No external dependencies
- Runs in any modern web browser

## Troubleshooting

- **Game doesn't load**: Ensure you're opening `index.html` directly in a browser (not just the file in VS Code)
- **Controls not working**: Make sure the browser window has focus
- **Performance issues**: The game limits clones to 5 for performance. If still slow, try a different browser
- **Audio not working**: Audio is not implemented in this version

## Development

The game consists of:
- `index.html`: Main HTML file
- `game.js`: Game logic and rendering
- `styles.css`: Minimal styling

To modify the game, edit `game.js` for gameplay changes.