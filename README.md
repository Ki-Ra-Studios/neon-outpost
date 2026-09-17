# NEON OUTPOST

A mobile-first HTML5 survival game starter designed to run directly from GitHub Pages.

## Run locally

Open `index.html` in a browser, or use any static server.

## GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, and `game.js`.
3. Go to **Settings → Pages**.
4. Deploy from the `main` branch and `/root`.
5. Open the generated Pages URL on your phone.

## Controls

- Mobile: drag anywhere on the game screen to move. The ship auto-targets and fires.
- Desktop: WASD / Arrow keys to move.
- The game is intentionally dependency-free: HTML + CSS + JavaScript + Canvas.

## Architecture

- `index.html` — shell, HUD, menus
- `style.css` — responsive/mobile presentation
- `game.js` — game loop, input, combat, spawning, particles, scoring and persistence

## Suggested next systems

1. Weapon upgrades and permanent progression.
2. Multiple enemy archetypes.
3. Boss waves.
4. Audio and haptics.
5. Asset pipeline.
6. Save slots / IndexedDB.
7. PWA install support.
8. Backend leaderboards.
9. Analytics.
10. Capacitor packaging for Android/iOS.
