# NeoRail — Train Ticket Booking System

A full-stack train ticket booking application with a Cyberpunk-Premium UI.

## Architecture

- **Backend:** Node.js + Express.js (port 3000)
- **Frontend:** React 18 + Vite + Tailwind CSS (port 5000)
- **Database:** MongoDB (local instance)
- **ODM:** Mongoose

## Project Structure

```
├── models/               # Mongoose schemas
│   ├── User.js           # name, email, password
│   ├── Train.js          # train_name, train_number, from/to_station, seats[]
│   └── Ticket.js         # user_id, train_id, seat_number, status
├── routes/               # Express route handlers
│   ├── userRoutes.js     # POST /register, POST /login
│   ├── trainRoutes.js    # POST /add, GET /, GET /search, GET /:id
│   └── ticketRoutes.js   # POST /book, GET /user/:id, POST /not-boarded, etc.
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css     # Cyberpunk theme (CSS variables + Tailwind)
│   │   ├── services/api.js      # Axios API service layer
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Search page
│   │   │   ├── Trains.jsx      # Train listing with real-time seats
│   │   │   ├── SeatMap.jsx     # Visual seat grid + booking
│   │   │   └── Dashboard.jsx   # My Tickets
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── AuthModal.jsx   # Login/Register modal
│   │       └── TicketCard.jsx
│   └── vite.config.js    # Proxy /api → localhost:3000
├── seed.js               # Seeds 5 sample trains on every start
├── server.js             # Express app entry point (port 3000)
└── start.sh              # Launches MongoDB → seeds → backend → frontend
```

## API Endpoints

### Users
- `POST /api/users/register` — `{ name, email, password }`
- `POST /api/users/login` — `{ email, password }` → `{ user }`

### Trains
- `GET /api/trains` — All trains
- `GET /api/trains/search?from=X&to=Y` — Search by station
- `GET /api/trains/:id` — Single train with seat data
- `POST /api/trains/add` — Add a train

### Tickets
- `POST /api/tickets/book` — `{ user_id, train_id }` → auto-assigns seat
- `GET /api/tickets/user/:userId` — User's tickets with enriched train data
- `POST /api/tickets/not-boarded` — Mark seat as not boarded
- `POST /api/tickets/confirm-seat` — Confirm notified seat
- `POST /api/tickets/open-seat` — Open seat for all

## Seat Statuses
- `available` — Can be booked
- `open` — Re-opened, can be booked
- `booked` — Taken
- `not_boarded` — Freed up, waiting for confirmation

## Ticket Statuses
- `confirmed` — Seat assigned
- `waiting` — Waitlisted
- `notified` — Seat available, pending confirmation

## Environment Variables
- `MONGO_URI` — MongoDB connection string (secret)

## Running
`bash start.sh` — starts MongoDB, seeds data, launches backend (3000) and frontend (5000)
