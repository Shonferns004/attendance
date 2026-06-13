# TalentForge — Recruiter Studio

A React recruiter panel sharing the same design system as the HR panel.

## Panels
- **Dashboard** — open roles, applicants, interviews, offers + top candidates by AI score
- **AI Leads** — paste a résumé to get an AI match score & breakdown, or generate a
  sourcing strategy for any role (powered by Claude via the Anthropic API)
- **Pipeline** — drag-and-drop kanban across New → Screening → Interview → Offer → Hired
- **Candidates** — searchable, filterable table of every applicant
- **Jobs** — open new roles and track applicant counts
- **Interviews** — upcoming interview schedule

## Run it
```bash
npm install
npm run dev
```

## About the AI features
The AI Leads panel calls Claude through the Anthropic Messages API. When this app
runs inside the Claude Artifacts environment the API key is handled automatically —
no key in the code. To run it on your own infrastructure, route the `fetch` in
`src/ai.js` through a small backend that injects your `x-api-key` and
`anthropic-version` headers (never ship a key in front-end code).

## Note on data
State lives in React memory (`src/store.jsx`) and resets on refresh. Point that
one file at a backend or browser storage to make it persist.
