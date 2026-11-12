# Lab 5 Deployment Notes

## Stack
Node.js 24 + TypeScript, Express 5, Prisma 6, PostgreSQL 16, Vitest. The UI is static files in `public/`, served by Express.

Changes made for Lab 5: SQLite changed to PostgreSQL; login and sessions stored in the database (sessions table, hashed tokens); assets, borrow requests and loans stored in the database instead of memory; demo passwords moved out of code into environment variables; `/api/health` and `/api/ready` added.

## Environment variables
| Variable | Purpose | Secret? | Where the value comes from |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes | Local: `.env`. Cloud: Secret Manager |
| `PORT` | HTTP port (default 3000) | No | Environment |
| `ADMIN_PASSWORD` | Password for the first Custodian account, set by the seed | Yes | Local: `.env`. Cloud: Secret Manager |
| `DEMO_USER_PASSWORD` | Password for the demo Borrower account | Yes | Local: `.env`. Cloud: Secret Manager |
| `SEED_DEMO_DATA` | `true` creates the demo Borrower account | No | Environment |
| `TEST_DATABASE_URL` | Separate database for automated tests (name must contain `test`) | Yes | Local: `.env`. CI: workflow environment |

Only `.env.example` (placeholders) is committed. `.env` is in `.gitignore`.

## Commands
- Install: `npm ci`
- Start local database: `docker run -d --name inv-db -e POSTGRES_USER=inventory -e POSTGRES_PASSWORD=<local password> -e POSTGRES_DB=inventory -p 5433:5432 postgres:16-alpine`
- Migrate: `npx prisma migrate deploy` (development: `npx prisma migrate dev`)
- Seed: `npx prisma db seed`
- Test: `npm test`
- Build: `npm run build`
- Run: `npm start`

## GCP resources
_To be filled in Step 5._

## Release procedure
_To be filled in Step 7._
