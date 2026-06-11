# CP Duel — Competitive Programming 1v1 Platform

A full-stack real-time platform where two programmers race to solve the same Codeforces problem first.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS, Socket.IO client |
| Backend | Node.js, Express.js, MongoDB + Mongoose, JWT auth, Socket.IO |
| External API | Codeforces API (problems + user submissions) |
| Deployment | Frontend → Vercel, Backend → Render |

---

## Project Structure

```
cp-duel/
├── backend/
│   └── src/
│       ├── config/         # DB connection
│       ├── controllers/    # auth, room, duel logic
│       ├── middleware/     # JWT auth middleware
│       ├── models/         # User, Room Mongoose schemas
│       ├── routes/         # Express route definitions
│       ├── services/       # Codeforces API, submission polling
│       ├── sockets/        # Socket.IO event handlers
│       └── server.js       # Entry point
└── frontend/
    └── src/
        ├── context/        # AuthContext (user state + login/logout)
        ├── pages/          # Login, Register, Dashboard, RoomLobby, DuelPage, ResultPage
        ├── components/     # Navbar
        ├── services/       # Axios API client (auto-attaches token)
        ├── sockets/        # Socket.IO singleton
        └── App.jsx         # Router + protected routes
```

---

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, CLIENT_URL=http://localhost:5173
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

Open `http://localhost:5173`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Rooms
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/rooms/create` | Yes | Create a new room |
| POST | `/api/rooms/join` | Yes | Join room by roomId |
| GET | `/api/rooms/:id` | Yes | Get room state |

### Duel
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/duel/start` | Yes | Host starts duel, selects CF problem |
| GET | `/api/duel/status/:roomId` | Yes | Get current duel status + problem |

### Socket Events

**Client → Server**
| Event | Payload | Description |
|---|---|---|
| `createRoom` | `{ roomId, username }` | Host joins socket room |
| `joinRoom` | `{ roomId, username, players }` | Opponent joins |
| `startGame` | `{ roomId }` | Host confirms start |
| `leaveRoom` | `{ roomId, username }` | Player leaves |

**Server → Client**
| Event | Payload | Description |
|---|---|---|
| `playerJoined` | `{ players, roomId }` | Broadcast when 2nd player joins |
| `gameStarting` | `{ roomId }` | Host clicked start |
| `duelStarted` | `{ problem, startedAt }` | Problem selected, duel live |
| `gameResult` | `{ winner, submissionTime, problem }` | Winner found |
| `playerLeft` | `{ username }` | Player disconnected |

---

## Game Flow

```
Register / Login
      │
  Dashboard
  ┌────┴────┐
Create     Join (code)
  Room       Room
      │         │
      └────┬────┘
       Room Lobby
     (wait for 2 players)
           │
      Host clicks
      "Start Duel"
           │
    Backend selects problem
    (CF API, rating-matched,
     not solved by either)
           │
       Duel Page
    (timer + problem link)
           │
    Both players open CF
    and start coding...
           │
    Backend polls every 6s
    (CF user.status API)
           │
    First AC on the problem
           │
       Result Page
    (winner / loser screen)
```

---

## Problem Selection Logic

- Average of both players' ratings → `avgRating`
- Range: `[avgRating - 200, avgRating + 200]`
- Filters applied:
  - Must not be solved by either player (last 1000 submissions checked)
  - Must not be a Gym problem (`contestId < 100000`)
  - Must not have banned tags (`*special`, `interactive`)
- Random pick from eligible candidates

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables:
   ```
   PORT=10000
   MONGO_URI=<your Atlas URI>
   JWT_SECRET=<random 32+ char string>
   CLIENT_URL=https://your-frontend.vercel.app
   ```

### Frontend → Vercel

1. Import project, set root to `frontend/`
2. Framework preset: **Vite**
3. Environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. `vercel.json` handles SPA routing (already included)

---

## Notes

- Polling stops automatically when a winner is detected
- Room state is persisted in MongoDB (not just in-memory), so page refreshes survive
- JWT token is stored in `localStorage`, attached via Axios interceptor
- Socket.IO uses both `websocket` and `polling` transports (required for Render proxy)
- CORS is configured to allow only the explicit `CLIENT_URL` in production

---

