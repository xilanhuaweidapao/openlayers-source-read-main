# AGENTS

This repository is a source snapshot of OpenLayers. Most work will be in
`src/ol`, with a smaller subset in `mini-src`.

## Project layout (this snapshot)
- `src/ol/`: main library source code.
- `mini-src/`: small subset (currently `mini-src/renderer`).
- `imgs/`: image assets.

## Docs to read first
- `README.md`, `DEVELOPING.md`, `CONTRIBUTING.md`.
- Look for per-folder `readme.md` files; for example,
  `src/ol/format/readme.md` explains how to implement format parsers.

## Setup
- Requires Git and Node.js (>= 8) in PATH.
- Install dependencies: `npm install`.

## Common scripts (package.json)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests (browser + node + rendering): `npm test`
- Dev server for examples: `npm run serve-examples`

## Snapshot limitations
- This checkout only includes `src/`, `mini-src/`, and `imgs/`.
- Standard OpenLayers folders like `examples/`, `test/`, `config/`, and
  `tasks/` are not present here, so the scripts above may not work unless
  those directories are added.

## Contribution notes
- Follow OpenLayers coding style and commit message conventions
  (see `CONTRIBUTING.md`).
- Keep changes focused on a single issue or feature.
