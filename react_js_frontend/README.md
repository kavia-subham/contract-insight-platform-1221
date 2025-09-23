# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- Pure CSS + React (no heavy UI frameworks)
- Minimalist Pure White theme with sidebar, top bar, and main content layout
- Backend integration via environment-based base URL

## Getting Started

Environment variable:
- REACT_APP_API_BASE_URL: Base URL of the FastAPI backend (e.g., http://localhost:8000). Create a `.env` file based on `.env.example`.

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Layout

The app uses a simple grid-based layout:
- Sidebar for navigation
- Top bar with theme toggle and profile area
- Main content area for Dashboard, upload, contract list, and Contract Detail with PDF/insights

Styles are defined in:
- `src/App.css` – base theme variables
- `src/layout.css` – app shell layout (sidebar/topbar/content)
- `src/components/*.css` – component styles

## Backend Integration

The UI integrates with these endpoints:
- GET `/contracts` – list contracts
- POST `/contracts` – upload a contract PDF
- GET `/contracts/{contract_id}/insights` – get insights JSON
- GET `/deadlines/upcoming` – upcoming deadline items

Set `REACT_APP_API_BASE_URL` to the backend root to use absolute URLs; if not set, relative paths are used assuming a reverse-proxy.

## Notes

- Contract PDF rendering is a lightweight stub with anchors corresponding to insights (no heavy PDF viewer dependency).
- Ensure CORS is enabled on the backend if serving from different origins.
