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
- **GCP Project:** `CPE334 Team Top 2` (`cpe334-team-top-2`)
- **Region:** `asia-southeast1` (Singapore)
- **Artifact Registry Repository:** `inventory` (`asia-southeast1-docker.pkg.dev/cpe334-team-top-2/inventory/inventory`)
- **Cloud Run Service:** `inventory` (Port `3000`, `NODE_ENV=production`, `TZ=Asia/Bangkok`)
- **Cloud Run Migration Job:** `inventory-migrate`
- **Secret Manager Secrets:** `inventory-database-url` (mounted as `DATABASE_URL`), plus `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD`
- **Deployer Service Account (Workload Identity Federation):** `inventory-deployer@cpe334-team-top-2.iam.gserviceaccount.com`
- **Live Cloud Run URLs:**
  - `https://inventory-ftuxc6vyna-as.a.run.app`
  - `https://inventory-440201626365.asia-southeast1.run.app`

## Release procedure
1. **Branch & PR Promotion (`feature/docs` -> `sprint-staging` -> `main`):**
   - Open a Pull Request from the feature/docs branch into `sprint-staging`, wait for `CI & Docker Build / test-and-docker` to pass, obtain teammate approval, and merge.
   - Open a Release Pull Request from `sprint-staging` into `main`, wait for `CI & Docker Build / test-and-docker` to pass, obtain teammate approval, and merge.
2. **Automated CD Pipeline (`.github/workflows/deploy.yml` — `Deploy demo`):**
   - Merging to `main` automatically triggers the `Deploy demo` workflow:
     1. Runs `test / test-and-docker` to verify tests and the Docker build.
     2. Authenticates to Google Cloud via Workload Identity Federation (`inventory-deployer@cpe334-team-top-2.iam.gserviceaccount.com`).
     3. Builds and pushes an immutable Docker image tagged with the 40-character `GITHUB_SHA` to `asia-southeast1-docker.pkg.dev/cpe334-team-top-2/inventory/inventory:<SHA>`.
     4. Executes the `inventory-migrate` Cloud Run Job to apply database migrations and deploys the new image digest to the `inventory` Cloud Run service (`100%` traffic).
     5. Runs live smoke tests against the public Cloud Run URL (`health`, `readiness/DB`, and HTML).
3. **Rollback & Roll-Forward Procedure:**
   - Find the target immutable 40-character commit SHA in Artifact Registry (`inventory/inventory`) or a previous green `Deploy demo` run summary (e.g., Release A baseline `cfecbc7877092eb79d9b29b8cc0094837ed89c51`).
   - Open **GitHub -> Actions -> `Deploy demo` -> `Run workflow`** on branch `main`, enter the target 40-character commit SHA, and click **Run workflow**.
   - Confirm the workflow summary reports `Rollback: true`, verifies the expected container digest, and passes the live smoke test. Repeat with a newer commit SHA to roll forward.