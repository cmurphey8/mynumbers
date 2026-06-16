# ARITHMIX

A math puzzle game where you arrange numbers into equation templates to hit target values.

## Play Now

🎮 **[Play ARITHMIX](https://mynumbers.onrender.com)**

## Features

- **Practice Mode**: Solve puzzles at your own pace 
- **Rush Mode**: Race against the clock (3-min or 5-min challenges)
- **Inside ARITHMIX:** Explore the math and data structures behind the game.

## How to Play

1. You're given a target number and an equation template with operators
2. Drag numbers from the bank into the empty slots
3. Make the equation equal the target number
4. In Rush Mode, solve as many as you can before time runs out!

## Local Development

This is a Vite-built React library. You need [Node.js](https://nodejs.org/)
(v18+).

```bash
# Install dependencies
npm install

# Start the Vite dev server for local inspection
npm run dev
```

Vite prints the local URL (typically http://localhost:5173).


## Using ARITHMIX as a library

The game and explainer can be embedded in another app. `npm run build`
produces an ESM + UMD bundle (`dist/lib`) with type declarations.
`react`, `react-dom`, `@emotion/react`, and `@emotion/styled` are peer
dependencies that the host app provides.

React host:

```tsx
import { Arithmix } from "arithmix"

// Full app with built-in routing between the game and explainer:
<Arithmix />
```

