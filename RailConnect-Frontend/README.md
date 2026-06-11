# RailConnect Frontend

Simple React (Vite) frontend for the Railway Reservation System. It provides passenger booking flows, waitlist visibility, profile management, and an admin view for train and occupancy insights.

## Quick Start
- Prerequisites: Node.js 18+ and npm.
- Install deps: `npm install`
- Configure env: copy `.env.example` to `.env` and set:
	- `VITE_BACKEND_URL` (e.g., `http://localhost:5000`)
- Run dev server: `npm run dev`

## Scripts
- `npm run dev`: Start Vite dev server
- `npm run build`: Production build
- `npm run preview`: Preview the production build
- `npm run lint`: Lint the codebase

## Features
- User auth, profile update, password change
- Browse trains with availability and waitlist info
- Book/cancel tickets, view my bookings with status
- Admin stats view (occupancy, bookings breakdown)

## Tech Stack
- React 19 + Vite 7
- React Router, Context API
- ESLint for linting

## Project Structure
```
src/
	pages/        # Views (Home, Login, MyBookings, Admin, ...)
	components/   # UI components (Header, Dropdown, etc.)
	GlobalContext.jsx
	main.jsx, App.jsx
```

## Environment
- Backend base URL comes from `VITE_BACKEND_URL`.
- Ensure the backend is running and CORS/cookies are allowed if using auth via cookies.

## Notes
- This app expects the backend from the same project (RailConnect Backend). Update `VITE_BACKEND_URL` to match your backend host/port.