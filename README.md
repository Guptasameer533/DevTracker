# DevTrack

A portfolio-grade full-stack engineering project. DevTrack aggregates GitHub commit activity across repos into a single dashboard.

**Live demo:** [devtrack.example.com/demo](https://devtrack.example.com/demo) — no login required

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TanStack Query + Recharts + Tailwind CSS |
| Backend | Node.js 20 + Express + Prisma |
| Database | PostgreSQL |
| Auth | GitHub OAuth 2.0 + signed session cookies |
| Hosting | Vercel (frontend) + Render (backend + DB) |
| CI/CD | GitHub Actions |

---

## What it demonstrates

- **GitHub OAuth 2.0** — authorization code flow with CSRF state parameter, server-side token exchange
- **AES-256-GCM encryption** — GitHub tokens encrypted at rest, never stored in plaintext
- **Session management** — httpOnly/Secure/SameSite cookies, server-side session table, graceful expiry
- **Rate limiting** — 100 req/15min general, 20 req/15min on auth endpoints
- **Structured logging** — Winston JSON logs with requestId propagation across all log lines
- **Request tracing** — every response carries `X-Request-Id`, every log line carries `requestId`
- **Postgres caching** — 5-minute TTL on GitHub API responses to avoid rate-limit exhaustion
- **Error handling** — consistent `{ success, message, code, requestId }` envelope across all endpoints
- **Layered architecture** — controller → service → data; services are Express-agnostic and unit-testable
- **Test coverage ≥ 70%** on auth, stats, and utility code (Jest + Supertest)
- **CI pipeline** — lint → test → build → audit on every PR

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (local or via Docker)
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))

### 1. Clone and install

```bash
git clone https://github.com/yourusername/devtrack.git
cd devtrack
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/devtrack
GITHUB_CLIENT_ID=<your GitHub OAuth App client ID>
GITHUB_CLIENT_SECRET=<your GitHub OAuth App client secret>
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
FRONTEND_URL=http://localhost:5173
PORT=4000
NODE_ENV=development
```

**GitHub OAuth App settings:**
- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:4000/api/v1/auth/github/callback`

### 3. Run database migrations

```bash
cd server
npx prisma migrate dev --name init
```

### 4. Seed demo data (optional)

```bash
cd server
node prisma/seed.js
```

### 5. Start dev servers

```bash
# From repo root
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)
Backend: [http://localhost:4000](http://localhost:4000)
Health check: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## Running tests

```bash
cd server
npm test                # run all tests
npm run test:coverage   # with coverage report
```

---

## Project structure

```
devtrack/
├── .github/workflows/ci.yml     # CI pipeline
├── client/                      # React + Vite frontend
│   └── src/
│       ├── components/          # Charts, layout, UI primitives
│       ├── context/             # AuthContext, ThemeContext
│       ├── hooks/               # useStats, useRepos (TanStack Query wrappers)
│       ├── pages/               # Landing, Dashboard, Demo, Settings
│       └── services/api.js      # Single Axios instance, all API calls
└── server/
    ├── prisma/
    │   ├── schema.prisma        # P0 data model (User, Session, Repository, Commit)
    │   └── seed.js              # Demo mode data
    └── src/
        ├── config/env.js        # Zod env validation (exits if invalid)
        ├── controllers/         # Parse req, call service, shape response
        ├── middleware/          # authenticate, requestId, errorHandler, rateLimiter
        ├── routes/              # Thin routers, wire middleware
        ├── services/            # Business logic (Express-agnostic)
        └── utils/               # crypto (AES-256-GCM), logger (Winston), response helpers
```

---

## API reference

All routes prefixed `/api/v1`. Authenticated routes require session cookie.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness probe (checks DB) |
| GET | `/auth/github` | No | Initiate OAuth flow |
| GET | `/auth/github/callback` | No | OAuth callback |
| GET | `/auth/me` | Cookie | Current user + connected repo |
| POST | `/auth/logout` | Cookie | Clear session |
| GET | `/repos/available` | Cookie | List GitHub repos |
| POST | `/repos` | Cookie | Connect one repo |
| DELETE | `/repos` | Cookie | Disconnect repo |
| GET | `/stats/commits?from&to` | Cookie | Daily commit buckets |
| GET | `/stats/demo` | No | Demo mode stats |

**Response envelope:**
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "code": "ERR_CODE", "requestId": "req_..." }
```

---

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect this repo, set root directory to `server/`
3. Build command: `npm ci && npx prisma generate`
4. Start command: `npx prisma migrate deploy && node index.js`
5. Add all env vars from `.env.example` in the Render dashboard

### Frontend (Vercel)

1. Import this repo on Vercel
2. Set root directory to `client/`
3. Build command: `npm run build`
4. Output directory: `dist`

---

## Design decisions

See `server/` — every significant architectural decision is documented as an ADR inline in the HLD. Key ones:

- **Monolith** over microservices (ADR-001) — single process, one log stream
- **Postgres** over MongoDB (ADR-002) — relational data, interviewer-expected
- **Session cookies** for MVP, JWT rotation in P1 (ADR-003)
- **Synchronous webhook processing** — no Redis needed at our scale (ADR-004)
- **Prisma** ORM — type-safe queries, migrations as code (ADR-005)

---

## Roadmap

- **P1:** Teams, multi-repo, GitHub webhooks (HMAC verified), per-developer breakdown, JWT refresh rotation
- **P2:** Export data, mobile-optimized UI, WebSocket real-time updates
