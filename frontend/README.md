# Aavek — Real‑Time Agriculture Bot

Modern, responsive dashboard for real‑time farm monitoring. Aavek streams robot telemetry, visualizes position on a live map, tracks missions and history, surfaces alerts, and features a bottom‑right support chat. Designed for readability with a light theme.

## Tech Stack

- Vite + React (TypeScript)
- Tailwind CSS + shadcn/ui
- Leaflet + react‑leaflet (v4 for React 18)
- Zustand (state), TanStack Query (data), Framer Motion (UX)

## Features

- Live map view with markers, trails, and speed readouts
- Overview, Missions, Alerts, Plant Health, History, Live Vision pages
- Real‑time simulator stream for development
- Bottom‑right support chat widget (Aavek Support)
- Light theme for field readability

## Getting Started

### Requirements

- Node.js 18+ and npm
- Git (optional, for contributing)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Amanparashar-09/Aavek---Real-Time-Agriculture-Bot.git
cd Aavek---Real-Time-Agriculture-Bot

# Install dependencies
npm install

# Start the dev server
npm run dev
# Vite will print the local URL (e.g., http://localhost:5173 or a free port)
```

### Build & Preview

```bash
npm run build
npm run preview
```

## Project Structure

Key folders under `src/`:

- `pages/` — route pages like `Overview`, `Missions`, `Alerts`, `PlantHealth`, `LiveVision`, `HistorySystem`
- `components/` — UI primitives and layout (`AppShell`, `Sidebar`, `StatusBar`, shadcn/ui components)
- `components/common/ChatSupport.tsx` — floating support chat widget
- `services/` — `WebSocketService` for realtime connections
- `data/simulator/` — `StreamSimulator` for mock data streams during development
- `store/` — `useRobotStore` (Zustand)
- `lib/` — utilities

## Configuration Notes

- Vite alias: `@` → `./src`
- react‑leaflet pinned at v4.x for React 18 compatibility
- Tailwind config uses class‑based dark mode, but the app defaults to light
- Chat widget has a high z‑index to overlay the map cleanly

## Troubleshooting

- Port already in use: Vite will choose another port automatically.
- Missing plugin `@vitejs/plugin-react-swc`: run `npm install` again.
- Map/Context errors with react‑leaflet: ensure v4.x with React 18.
- HMR fails on syntax error: check the terminal stack and fix TSX/JSX.

## Contributing

PRs welcome. Please keep changes focused and follow the existing code style.

## License

Proprietary unless otherwise stated by the repository owner.
