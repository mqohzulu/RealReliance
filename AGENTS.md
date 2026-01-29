# AGENTS.md

## Project overview
- Repo contains:
  - `RealReliance/` (Angular frontend)
  - `RealRelianceBankingAPI-backEnd/` (.NET backend)
  - root scripts: `start.ps1`, `test.ps1`, `docker-compose.yml`
- Primary frontend path: `RealReliance/src/`

## Default expectations
- Be concise; propose a plan for non-trivial changes.
- Prefer `rg` for searching.
- Don’t run destructive commands (`git reset --hard`, `rm -rf`) unless asked.
- Don’t revert unrelated changes.

## Frontend conventions
- Framework: Angular
- Use existing styles and patterns unless asked to redesign.
- If adding UI, keep it responsive (mobile + desktop).
- Prefer editing:
  - `RealReliance/src/app/**`
  - `RealReliance/src/styles.css` (or `styles.scss` if present)

## What to ask before big changes
- Which page/component?
- Desired behavior and visual direction?
- Any API endpoints involved?

## Tests / verification
- If asked to run tests, use `test.ps1` at repo root or `npm test` in `RealReliance/`.
- If asked to start frontend, use `start.ps1` or `npm start` in `RealReliance/`.

## Commit guidance
- Do not commit unless explicitly asked.

## Environment notes
- Shell: PowerShell
- Windows paths
