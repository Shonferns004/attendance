# Aanya HR — People Studio

A React HR panel with a sidebar layout. Add workers, track leaves, mark
attendance, generate letters, send notifications, and plan a holiday chart.

## Run it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

## Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the built version
```

## Structure

- `src/App.jsx` — sidebar + top bar + panel switching
- `src/store.jsx` — shared state (workers, leaves, holidays, notifications)
- `src/icons.jsx` — inline SVG icons (no icon library needed)
- `src/components/` — one file per panel (Overview, Workers, Leaves,
  Attendance, Letters, Notify, Holidays)
- `src/index.css` — the full design system

## Note on data

State lives in React memory, so it resets on refresh. To make it persist,
wire `src/store.jsx` up to a backend or browser storage — every panel reads
and writes through that one file, so it's the only place you need to change.
