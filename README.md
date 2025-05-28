# Letter Laser - Typing Game

A Space Invaders-style typing game where you shoot descending letters by typing them correctly. Vibe-coded with my kids.

## Setup

1. Add sound effects to the `sounds` directory:
   - `sounds/laser.mp3` - A short laser sound effect
   - `sounds/explosion.mp3` - An explosion sound effect

You can find free sound effects from websites like:
- https://freesound.org/
- https://opengameart.org/
- https://soundbible.com/

## Features

- Progressive difficulty levels
- Visual feedback for typing
- Laser effects
- Particle explosions
- Floating score animations
- Sound effects
- Retro-style graphics

## How to Play

1. Use left and right arrow keys to move your ship
2. Type the letters/words/phrases as they descend
3. Each correct character will be highlighted in green
4. Complete the sequence to destroy the enemy
5. Avoid letting enemies reach the bottom
6. Progress through levels by scoring points

## Running the Game

1. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
2. Open your browser and go to:
   ```
   http://localhost:8000
   ``` 
