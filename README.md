# NeoRail — Train Ticket Booking System

A full-stack train ticket booking app with a Cyberpunk-Premium UI.

---

## Project Structure

```
neorail-project/
├── server.js             ← Backend entry point (Express API)
├── models/               ← MongoDB schemas (User, Train, Ticket)
├── routes/               ← API route handlers
├── seed.js               ← Seeds 5 sample trains into DB
├── .env.example          ← Copy this to .env and fill in values
├── package.json          ← Backend dependencies + scripts
└── frontend/             ← React + Vite frontend
    ├── src/
    │   ├── pages/        ← Home, Trains, SeatMap, Dashboard
    │   ├── components/   ← Navbar, AuthModal, TicketCard
    │   ├── services/     ← api.js (Axios API layer)
    │   └── context/      ← AuthContext
    └── package.json      ← Frontend dependencies
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) installed locally
  **OR** a free [MongoDB Atlas](https://www.mongodb.com/atlas) account

---

## Setup (Local Machine)

### 1. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and set your MongoDB connection string:

```env
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/train_ticket

# OR MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/train_ticket
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Seed the database with sample trains

```bash
npm run seed
```

---

## Running the App

### Option A — Run both with one command (recommended)

```bash
npm run dev:all
```

This starts:
- Backend API on `http://localhost:3000`
- Frontend UI on `http://localhost:5000`

Open **http://localhost:5000** in your browser.

---

### Option B — Run separately (two terminals)

**Terminal 1 — Backend:**
```bash
npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login |
| GET | `/api/trains` | List all trains |
| GET | `/api/trains/search?from=X&to=Y` | Search trains by station |
| GET | `/api/trains/:id` | Get train + seat map |
| POST | `/api/tickets/book` | Book a seat (auto-assigned) |
| GET | `/api/tickets/user/:userId` | Get user's tickets |
| POST | `/api/tickets/not-boarded` | Mark seat as not boarded |
| POST | `/api/tickets/confirm-seat` | Confirm a notified seat |

---

## Features

- **Home** — Search trains by origin and destination
- **Trains** — Live seat count, capacity bar, route info
- **Seat Map** — Visual grid of all seats colored by status
- **Auth** — Register / Login modal (glassmorphism design)
- **Dashboard** — "My Tickets" with filter by status

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| HTTP | Axios (with proxy via Vite) |
