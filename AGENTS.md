# Repository Guidelines

## Project Structure

Snake Meadow is a mobile-first browser game. Its source and tests live at the repository root.

- `index.html` defines the Traditional Chinese interface, inline SVG icons, and canvas. Keep the deferred script order so the renderer loads before the game starts.
- `style.css` handles the full-viewport layout, touch controls, and visual states.
- `scene.js` draws the meadow, snake, and apple. Edit the canvas drawing routines here for sprite or scenery changes.
- `game.js` contains the game rules in `createGame` and connects them to browser input, timing, audio, and score storage. Keep the rules usable from Node without a DOM.

## Local Development

Open `index.html` directly to play. For an HTTP preview, run `python3 -m http.server 8000 --bind 127.0.0.1` from the project root and open `http://127.0.0.1:8000/`. The browser loads the source files directly, with no install or build step.

## Coding Style

Use two-space indentation and follow the surrounding file’s formatting. Use camelCase for JavaScript functions and variables, and kebab-case for CSS classes such as `.field-title`. Keep player-facing labels in Traditional Chinese. This project has no configured linter or formatter.

## Testing

Run `node --test game.test.cjs`. The suite uses `node:test` and `node:assert/strict`. Name cases after observable behavior and pass a deterministic `random` function to `createGame` when food placement matters. For movement changes, check edge wrapping, self-collision after wrapping, and queued turns. For layout or input changes, play in portrait and landscape, swipe to turn, and rotate during a round.

## Commits and Pull Requests

Git history is unavailable in this checkout. Use a short, imperative commit subject describing the change. In a pull request, explain the player-visible effect, link a related issue when applicable, and list the checks you ran. Include a phone-sized screenshot for visual changes.
