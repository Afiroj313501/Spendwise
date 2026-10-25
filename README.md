# SpendWise
**Personal finance and expense analytics platform.** Track income and expenses, set monthly budgets and savings goals, and understand your spending through dashboards, charts and monthly reports.

[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)

> A full-stack portfolio project built to show how I design, build, test, secure and deploy a complete application with a real relational database.

---

## Live demo

| | |
|---|---|
| **App** |https://spendwise-drab-nine.vercel.app |
| **Demo account** | `demo@spendwise.app` / `Demo@1234` (or click **Try live demo** on the landing page) |

The demo account is shared and its password is public, so please don't store anything private in it.
The API runs on a free hosting tier. If nobody has used it for a while, **the first request can take up to a minute** while the server wakes up.

## Screenshots

| Landing page | Dashboard |
|---|---|
| ![Landing page](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Transactions | Budgets |
|---|---|
| ![Transactions](docs/screenshots/transections.png) | ![Budgets](docs/screenshots/budgets.png) |

| Goals and Budgets | Analytics |
|---|---|
| ![Goals and Savings](docs/screenshots/savings.png) | ![Analytics](docs/screenshots/analytics.png) |

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Security](#security)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Deployment](#deployment)
- [Engineering notes](#engineering-notes)
- [Limitations and roadmap](#limitations-and-roadmap)
- [Author](#author)

## Features

**Dashboard and analytics**
- Total balance, monthly income and monthly expenses, each with its change compared with the previous month (a month still in progress is compared with the same days of last month, so the comparison is fair)
- Six-month income vs. expense cash-flow chart and a spending breakdown by category
- Rule-based "Smart Insight" (for example, which category grew the most) with no paid AI service involved
- Month picker to look at any past month
- Monthly report page: savings rate, spending by category with change vs. last period, largest expenses, spending by day of the week, daily average

**Transactions**
- Add, edit and delete income and expenses with categories, dates and descriptions
- Search, filter by type, category and date range, sort, and paginate
- Totals that always reflect the current filters
- CSV export of everything matching the filters

**Budgets and goals**
- Monthly budget per expense category with spent, remaining and percent used
- Status: on track, near limit (80% and above), over budget (above 100%), with a warning on the dashboard
- Copy last month's budgets in one click
- Savings goals with a target, optional deadline, and add or withdraw funds

**Accounts and experience**
- Register, log in and log out, with sessions that renew silently
- Public landing page with a login and sign-up popup, and a one-click demo account
- Responsive layout with a bottom navigation bar on phones
- Loading skeletons, empty states, toast messages, error boundary and a 404 page
- Keyboard-friendly: skip link, visible focus, popups that return focus when closed

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, React Router, Tailwind CSS 4, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Supabase) with Prisma ORM and migrations |
| Validation | Zod (request bodies, query strings and environment variables) |
| Authentication | JWT access tokens, rotating refresh tokens in httpOnly cookies, bcrypt |
| Testing | Vitest and Supertest (API integration tests) |
| CI/CD | GitHub Actions (tests run against a real PostgreSQL service container), Dependabot |
| Hosting | Vercel (frontend), Render (API), Supabase (database) |

## Architecture

```mermaid
flowchart LR
  B[Browser] -->|HTTPS| V["Vercel<br/>React app + security headers"]
  V -->|"rewrite /api/*"| R["Render<br/>Express API"]
  R -->|Prisma| S[("Supabase<br/>PostgreSQL")]
```

The browser only ever talks to the Vercel domain. Vercel serves the React app and forwards `/api/*` to the Express API. This keeps the refresh-token cookie **first-party**, so it keeps working in browsers that block third-party cookies. The browser never connects to the database and never sees database credentials.

### How sessions work

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  B->>A: POST /api/auth/login
  A-->>B: access token (JSON) + refresh token (httpOnly cookie)
  B->>A: GET /api/transactions (Bearer access token)
  A-->>B: 401 when the access token has expired
  B->>A: POST /api/auth/refresh (cookie)
  A-->>B: new access token + rotated refresh cookie
  B->>A: retry the original request
```

The access token lives only in memory and expires after 15 minutes. The refresh token is a random value kept in an httpOnly cookie, stored in the database only as a hash, and replaced every time it is used.

## Data model

```mermaid
erDiagram
  USER ||--o{ CATEGORY : owns
  USER ||--o{ TRANSACTION : records
  USER ||--o{ BUDGET : sets
  USER ||--o{ SAVINGS_GOAL : saves
  USER ||--o{ REFRESH_TOKEN : has
  CATEGORY ||--o{ TRANSACTION : classifies
  CATEGORY ||--o{ BUDGET : limits

  TRANSACTION {
    uuid id PK
    decimal amount "DECIMAL(12,2)"
    enum type "INCOME or EXPENSE"
    date date
    string description
  }
  BUDGET {
    uuid id PK
    decimal amount "DECIMAL(12,2)"
    date month "first day of the month"
  }
  SAVINGS_GOAL {
    uuid id PK
    decimal targetAmount "DECIMAL(12,2)"
    decimal savedAmount "DECIMAL(12,2)"
    date deadline
  }
```

- All money is stored as `DECIMAL(12,2)`, never as floating point.
- Transaction dates are plain calendar dates, so a purchase made late on the 31st never slips into the next month because of a time zone.
- Deleting a user removes all of their data. Deleting a category keeps its transactions as "Uncategorized".

## Security

- **Passwords** are hashed with bcrypt and never stored or logged in plain text. Login answers are identical for an unknown email and a wrong password.
- **Sessions:** short-lived access token (HS256, algorithm pinned); the refresh token is single-use, rotated, hashed in the database and sent only as an httpOnly, Secure cookie scoped to `/api/auth`.
- **Authorization:** every query is filtered by the authenticated user's id. Someone else's record looks like a missing record (404), so ids cannot be probed.
- **Validation:** Zod validates every request body, query string and environment variable. Money is validated as text with at most two decimals, so it never passes through a floating-point number.
- **Browser protections:** Helmet, a CORS allowlist, an `Origin` check on state-changing requests, and `Cache-Control: no-store` on all API responses so no CDN can cache per-user data. The frontend ships a Content Security Policy and other security headers.
- **Abuse limits:** rate limiting on login (failed attempts only), sign-up, token refresh, CSV export and the API as a whole, plus a 50 KB request body limit.
- **Safe errors:** unexpected errors return a generic message; details stay in the server log.
- **CSV export** neutralizes cells that start with `=`, `+`, `-` or `@` so a malicious description cannot run as a spreadsheet formula.
- **Database:** Row Level Security is enabled on every table so Supabase's public Data API exposes nothing. The application reaches the database only through its own server.
- **Supply chain:** Dependabot, GitHub secret scanning, and `npm audit` in CI.

## API overview

All routes are under `/api`. Everything except sign-up, login, refresh, logout and the health checks requires `Authorization: Bearer <access token>`.

| Area | Method and path | Description |
|---|---|---|
| Auth | `POST /auth/register` | Create an account (also creates default categories) |
| | `POST /auth/login` | Log in |
| | `POST /auth/refresh` | Renew the session using the refresh cookie |
| | `POST /auth/logout` | End the session |
| | `GET /auth/me` | Current user |
| Categories | `GET /categories` | List categories |
| | `POST /categories` | Create a category |
| | `DELETE /categories/:id` | Delete a category |
| Transactions | `GET /transactions` | List with `search`, `type`, `categoryId`, `from`, `to`, `sortBy`, `order`, `page`, `limit`; returns totals for the filtered set |
| | `GET /transactions/export` | Download matching transactions as CSV |
| | `POST /transactions` | Create |
| | `GET /transactions/:id` | Read one |
| | `PATCH /transactions/:id` | Update |
| | `DELETE /transactions/:id` | Delete |
| Budgets | `GET /budgets?month=YYYY-MM` | Budgets with spent, remaining, percent and status |
| | `PUT /budgets` | Create or update a budget |
| | `POST /budgets/copy` | Copy budgets from one month to another |
| | `DELETE /budgets/:id` | Delete |
| Goals | `GET /goals` | List goals |
| | `POST /goals` | Create |
| | `PATCH /goals/:id` | Update |
| | `POST /goals/:id/funds` | Add or withdraw funds |
| | `DELETE /goals/:id` | Delete |
| Analytics | `GET /analytics/summary?month=` | Balance, income, expense and comparison with the previous period |
| | `GET /analytics/cashflow?month=&months=` | Monthly income and expense series |
| | `GET /analytics/breakdown?month=` | Spending by category |
| | `GET /analytics/report?month=` | Full monthly report |
| Health | `GET /health`, `GET /health/db` | Liveness and database checks |

Amounts are returned as exact decimal strings (for example `"450.50"`) and dates as `YYYY-MM-DD`.

## Project structure

```
SpendWise/
├── client/
│   ├── src/
│   │   ├── components/     shared UI (cards, modal, pagination, toasts, error boundary)
│   │   ├── features/       auth, dashboard, transactions, budgets, goals
│   │   ├── hooks/
│   │   ├── layouts/        app shell and navigation
│   │   ├── pages/          landing, dashboard, transactions, budgets, goals, analytics
│   │   ├── services/       API client and typed requests
│   │   ├── types/
│   │   └── utils/
│   └── vercel.json         API rewrite and security headers
├── server/
│   ├── prisma/             schema, migrations, seed script
│   ├── src/
│   │   ├── config/         environment validation, Prisma client
│   │   ├── middleware/     auth, validation, rate limits, origin guard, error handling
│   │   ├── modules/        auth, categories, transactions, budgets, goals, analytics
│   │   └── utils/
│   └── tests/              Vitest and Supertest
└── .github/workflows/      CI
```

## Getting started

### Prerequisites

- Node.js 20 or newer and npm
- A PostgreSQL database: a free [Supabase](https://supabase.com) project, or a local PostgreSQL

### 1. Install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

npm install              # root: installs the tool that runs client and server together
npm install --prefix server
npm install --prefix client
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` locally, `production` when deployed |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Allowed front-end origin(s), comma-separated (default `http://localhost:5173`) |
| `DATABASE_URL` | Connection string the app uses. With Supabase, the transaction pooler (port 6543) ending in `?pgbouncer=true` |
| `DIRECT_URL` | Connection string used for migrations. With Supabase, the session pooler (port 5432). With a local database, use the same value as `DATABASE_URL` |
| `JWT_ACCESS_SECRET` | Random secret, at least 32 characters |
| `ACCESS_TOKEN_TTL_SECONDS` | Access token lifetime (default `900`) |
| `REFRESH_TOKEN_DAYS` | Refresh token lifetime (default `7`) |
| `COOKIE_SAME_SITE` | `lax` (default). Use `none` only if the browser calls the API directly from another site |
| `TRUST_PROXY_HOPS` | Number of proxies in front of the API (default `1`; `2` behind Vercel and Render) |

Generate a secret with:

```bash
node -p "require('crypto').randomBytes(48).toString('hex')"
```

A local PostgreSQL example (no pooler options needed):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spendwise"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/spendwise"
```

> Never commit `.env` files. They are already in `.gitignore`.

### 3. Create the database and demo data

```bash
cd server
npx prisma migrate dev     # creates the tables
npm run db:seed            # demo user with realistic transactions, budgets and goals
cd ..
```

### 4. Run

```bash
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000/api/health
- Demo login: `demo@spendwise.app` / `Demo@1234`

### Useful scripts (in `server/`)

| Script | Purpose |
|---|---|
| `npm run dev` | API with automatic reload |
| `npm run build` / `npm start` | Compile and run the production build |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Recreate the demo user and data |
| `npm run db:studio` | Browse the data in Prisma Studio |
| `npm test` | Run the test suite |

## Testing

The API has automated integration tests (Vitest and Supertest) that run against a real PostgreSQL database. They cover:

- **Authentication:** registration rules, hashed passwords, login behavior, token expiry, refresh-token rotation and logout
- **Data isolation:** one user can never read, change or delete another user's transactions, categories, budgets or goals, and every protected route rejects anonymous requests
- **Security behavior:** security headers, Origin checks, malformed and oversized requests, unsigned or wrongly signed tokens, and cache headers

To run them, create a separate test database. The tests delete data, so the setup **refuses to run** unless the database looks like a test database.

```bash
# server/.env.test  (never commit this file)
NODE_ENV=test
PORT=5001
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=spendwise_test"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=spendwise_test"
JWT_ACCESS_SECRET=test_secret_that_is_at_least_32_characters_long_0000
```

```bash
cd server
npm run test:db     # applies migrations to the test schema
npm test
```

GitHub Actions runs the same tests on every push against a throwaway PostgreSQL container, after applying all migrations to an empty database, and builds the frontend.

## Deployment

| Part | Service | Notes |
|---|---|---|
| Database | Supabase | Run `npx prisma migrate deploy` against it, then `npm run db:seed` for the demo user |
| API | Render (web service) | Root directory `server`. Build: `npm ci --include=dev && npx prisma migrate deploy && npm run build`. Start: `npm start`. Health check: `/api/health` |
| Frontend | Vercel | Root directory `client`. `vercel.json` forwards `/api/*` to the API and sets security headers |

API environment variables: the table in [Getting started](#2-configure-the-server), with `NODE_ENV=production`, `CLIENT_URL` set to the Vercel URL, `COOKIE_SAME_SITE=lax` and `TRUST_PROXY_HOPS=2`.

On free hosting the API sleeps after a period without traffic. A free uptime monitor that calls `/api/health/db` every few minutes keeps it awake and keeps the database active.

## Engineering notes

A few decisions worth explaining:

- **Money is never a float.** Amounts are `DECIMAL(12,2)` in PostgreSQL, handled as Prisma decimals on the server and sent to the client as strings. A test adds `0.10 + 0.20` and expects exactly `0.30`.
- **Dates are calendar dates.** Using a `DATE` column instead of a timestamp avoids month-boundary bugs for users outside UTC.
- **Fair comparisons.** For a month in progress, the dashboard compares against the same number of days in the previous month, not the whole month, which would always look like a large drop.
- **Atomic savings withdrawals.** Withdrawing funds is a single conditional `UPDATE`, so two simultaneous requests can never overdraw a goal. This is covered by a test that fires both at once.
- **First-party cookies through a proxy.** Rather than relying on cross-site cookies, the frontend host proxies the API, so sessions survive browsers that block third-party cookies.
- **Refresh-token rotation.** A refresh token can be used once. Replaying an old one fails, and only a hash is stored.
- **Isolation by construction.** Services always filter by the authenticated user's id, and a dedicated test suite checks every module.
- **Insights without an AI bill.** Smart Insights are plain rules over the user's own data, so the app has no paid external API.

## Limitations and roadmap

Known limitations:

- One currency per user (BDT by default); no multi-currency support yet
- No email verification or password reset
- The frontend has no automated tests yet (the API does)
- Free hosting means occasional slow first loads

Ideas for next steps:

- Recurring transactions and CSV import with validation
- Multi-currency support
- Password reset by email
- Frontend component tests and end-to-end tests
- Dark mode

## Author

**YOUR NAME**

- Portfolio: https://abdullahfiroj-dev.vercel.app
- LinkedIn:  https://www.linkedin.com/in/abdullah-firoj-900697375
- GitHub:    https://github.com/Afiroj313501

## License

MIT. Add a `LICENSE` file to the repository, or remove this section.