<div align="center">
<img width="1365" height="1024" alt="Magic Mini Sudoku banner" src="./Sudoku%204x4.png" />
</div>

# Magic Mini Sudoku

A playful 4x4 Sudoku game built with React and Vite, designed for short mobile play sessions and Telegram-friendly webviews.

## Live Site

GitHub Pages:
`https://keemsome.github.io/Mini-Sudoku-4x4/`

## Gameplay

- `Beginner`, `Explorer`, and `Master` difficulty modes
- Guaranteed uniquely solvable puzzles
- Keyboard support for `Tab`, arrow keys, number keys, `Backspace/Delete`, and `Enter`
- One hint available in `Beginner` and `Explorer`
- No hints in `Master`
- Mobile-first layout with short-screen handling and centered win-state overlay

## Tech Stack

- React 18
- Vite
- TypeScript
- Lucide React
- GitHub Pages via GitHub Actions workflow

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`
3. Open the local Vite URL shown in the terminal.

## Build

- Production build:
  `npm run build`
- Preview the built app locally:
  `npm run preview`

## Validation

- Run `npm run test:puzzles` to sample generated puzzles and confirm each difficulty produces uniquely solvable boards.
- Run `npm run build` before shipping UI changes to ensure the Pages bundle still compiles.

## Deployment

- The site is deployed through GitHub Pages
- Deployment is workflow-based, not raw branch hosting
- Pushes to `main` trigger the Pages build and deploy workflow in `.github/workflows/deploy.yml`

## Notes

- Hard mode does not provide hints.
- Puzzle generation retries until a board has exactly one solution.
- The finish state uses a centered overlay so mobile screens do not need to scroll to see the win CTA.
