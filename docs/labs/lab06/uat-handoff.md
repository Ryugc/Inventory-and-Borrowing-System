# CPE 334 Lab 6 Part A — Sprint 1 UAT Handoff

## Handoff Metadata

| Item | Value |
|---|---|
| Product Team | CPE334 Team Top 2 — Grittapob Chutitas (Ryugc) & Moe Thauk Ko (MoeThaukKo3483) |
| Repository | https://github.com/Ryugc/Inventory-and-Borrowing-System |
| Live Deployed URL | https://inventory-ftuxc6vyna-as.a.run.app |
| Assessed Sprint 1 Commit SHA | `13a8d949e8961fe25d37b5ff6e7b8030fb094431` |
| Cloud Run Revision | `inventory-00006-hxv` |
| Assessed Scope | Sprint 1 features and acceptance criteria only. Exclude Sprint 2/3 items. |

This handoff is based on the Sprint 1 plan, contracts, Feature 02 checkout specification, traceability matrix, API routes, and Prisma seed script. Dates and due-date behavior are not evaluated; enter the UI-provided due date only when checkout requires it.

## Safe Test Accounts and Synthetic Data

Use only the synthetic identities below. Obtain each password through the Product Team's private sharing channel. Passwords and deployment secrets are intentionally not included here.

| Seeded role | Username | Password |
|---|---|---|
| Borrower (`BORROWER`) | `borrower@ku.ac.th` (created only when `SEED_DEMO_DATA=true`) | `[SHARED PRIVATELY]` |
| Custodian (`CUSTODIAN`) | `custodian@ku.ac.th` (created by the seed script) | `[SHARED PRIVATELY]` |

UAT-03 additionally requires a second synthetic borrower, `borrower2@ku.ac.th` (`BORROWER`), to own a request that the primary borrower must not see. This account is **not** created by the seed script; an authorized Product Team / Operator must provision it and share its password privately before the UAT. Self-registration is not available.

The seed script creates or upserts these three assets:

| Asset tag | Name | Category | Baseline status after reset |
|---|---|---|---|
| `TAG-RPI-001` | Raspberry Pi 5 | Microcontrollers | `AVAILABLE` |
| `TAG-DSO-001` | Oscilloscope | Test Equipment | `AVAILABLE` |
| `TAG-SNS-001` | Sensor Kit | Sensors | `AVAILABLE` |

The system tracks individual tagged assets and their status; it has no numeric stock quantity. For this handoff, “decremented stock” means the requested asset changes from `AVAILABLE` to `CHECKED_OUT`.

### Product Team / Operator Reset Procedure

**External UAT testers do not have or need direct Cloud SQL access.** An authorized Product Team / Operator should run this procedure against the intended UAT database before a clean UAT run, then confirm completion to the UAT Team through the agreed channel. Verify the target environment before executing; this removes all borrow-request and loan test rows in that database.

```sql
BEGIN;
DELETE FROM "Session";
DELETE FROM "LoanRecord";
DELETE FROM "BorrowRequest";
UPDATE "Asset"
SET "status" = 'AVAILABLE'::"AssetStatus",
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "assetTag" IN ('TAG-RPI-001', 'TAG-DSO-001', 'TAG-SNS-001');
COMMIT;

SELECT "assetTag", "status"
FROM "Asset"
WHERE "assetTag" IN ('TAG-RPI-001', 'TAG-DSO-001', 'TAG-SNS-001')
ORDER BY "assetTag";
SELECT COUNT(*) AS remaining_requests FROM "BorrowRequest";
SELECT COUNT(*) AS remaining_loans FROM "LoanRecord";
```

Confirm all three assets are `AVAILABLE`, and both transaction counts are zero. This cleanup preserves the seeded users and assets. The seed script is **not** a transaction reset: its asset upserts do not overwrite existing statuses, and it does not delete requests or loans. Do not rerun seeding as a substitute for this procedure. To repeat the UAT later, ask the Product Team / Operator to run the reset again; do not ask testers to access the database.

### Recommended UAT Execution Order

After the Operator confirms a clean reset and privately confirms both borrower accounts are ready, execute cases in this order:

1. **UAT-05** — test invalid credentials and an unauthenticated catalog request; this does not change data.
2. **UAT-01** — use `TAG-RPI-001` for the normal borrower-to-custodian checkout. Keep the generated request ID.
3. **UAT-02** — use the now-checked-out `TAG-RPI-001` to test rejection of an unavailable asset.
4. **UAT-03** — have `borrower2@ku.ac.th` create a pending request for `TAG-SNS-001`; then test borrower ownership visibility and forbidden checkout using that request ID. Leave it pending.
5. **UAT-04** — verify the UAT-01 request and `TAG-RPI-001` state after logout, hard refresh, and login again. Confirm `TAG-DSO-001` remains the untouched `AVAILABLE` catalog control.

UAT-03 creates a pending request, and UAT-01 creates an active loan. The Operator reset procedure is needed before repeating this complete sequence.

## Executable UAT Cases

Use the live deployed URL above for browser actions. For direct API steps, use an API client such as Postman against the same host and paths below. Keep bearer tokens and passwords in the client’s private/local environment; do not put them in screenshots, reports, or shared collections. All expected statuses and response text below refer to Sprint 1 behavior.

### UAT-01 — Normal Domain Journey

- **Case ID:** `UAT-01`
- **Linked Sprint 1 FR & AC IDs:** FR-01, FR-02, FR-03, FR-04; AC-AUTH-01, AC-CAT-01, AC-CAT-03, AC-REQ-01, AC-CHK-01, AC-CHK-02
- **Related contract STS IDs:** STS-AUTH-001, STS-AUTH-002, STS-CATALOG-001, STS-CATALOG-003, STS-REQUEST-001, STS-CHECKOUT-001, STS-CHECKOUT-002
- **Purpose:** Verify that a borrower can browse and request an available asset and a custodian can approve the request as a checkout.
- **Role:** Borrower, then Custodian
- **Preconditions:** Operator reset is complete; both seeded accounts can sign in; `TAG-RPI-001` and `TAG-DSO-001` are `AVAILABLE`.
- **Synthetic Inputs:** `TAG-RPI-001`; borrower account; custodian account; use the due date prefilled by the UI without evaluating due-date rules.
- **Numbered User Actions:**
  1. Open the deployed URL and sign in as `borrower@ku.ac.th`.
  2. In **Catalog**, locate `Raspberry Pi 5` (`TAG-RPI-001`). Confirm it is `AVAILABLE`, then select **Request**.
  3. Open **My requests** and confirm the request status is `PENDING`.
  4. Sign out, then sign in as `custodian@ku.ac.th`.
  5. Open **Active loans** and locate the pending request for `TAG-RPI-001`. Record its request ID from the pending-request entry, select **Approve / Checkout**, leave the UI-provided due date as-is, and submit **Checkout**.
  6. Refresh the catalog and active-loans list.
- **Specific Expected Results:**
  - Both accounts authenticate with their corresponding roles.
  - The catalog shows the asset tag, name, category, and `AVAILABLE` status; a borrower can submit a request.
  - The request appears in the custodian queue as `PENDING`.
  - Checkout succeeds; the pending request leaves the queue, an active loan appears, and `TAG-RPI-001` changes to `CHECKED_OUT`.

### UAT-02 — Unavailable Asset Rejection

- **Case ID:** `UAT-02`
- **Linked Sprint 1 FR & AC IDs:** FR-03; AC-REQ-02
- **Related contract STS IDs:** STS-REQUEST-002
- **Purpose:** Verify that the backend rejects a borrow request for an unavailable asset with a clear conflict response.
- **Role:** Borrower
- **Preconditions:** UAT-01 has completed successfully and `TAG-RPI-001` is `CHECKED_OUT`; the borrower account is signed in or its private API-client token is available.
- **Synthetic Inputs:** Asset tag `TAG-RPI-001`; retrieve its current `id` from `GET /api/assets` using the borrower token.
- **Numbered User Actions:**
  1. In the browser catalog, confirm `TAG-RPI-001` is `CHECKED_OUT` and its **Request** control is disabled.
  2. In the API client, send `GET /api/assets` with the borrower bearer token and note the `id` for `TAG-RPI-001`.
  3. Send `POST /api/borrow-requests` with the same bearer token and JSON body `{"assetId":"<TAG-RPI-001 id>"}`.
  4. Reopen the catalog and the custodian active-loans list.
- **Specific Expected Results:**
  - The request returns HTTP `409 Conflict` with a clear unavailable-asset message (expected message: `Asset is unavailable`).
  - No new request is created; `TAG-RPI-001` remains `CHECKED_OUT` and its existing active loan remains unchanged.

### UAT-03 — Forbidden Role and Ownership

- **Case ID:** `UAT-03`
- **Linked Sprint 1 FR & AC IDs:** FR-05; BR-03, BR-04; AC-AUTH-04, AC-REQ-04, AC-REQ-05
- **Related contract STS IDs:** STS-AUTH-005, STS-REQUEST-004 (planned)
- **Purpose:** Verify that a borrower sees only their own request records and cannot approve/checkout another borrower’s request.
- **Role:** Borrower (`borrower2@ku.ac.th` to create the other user’s record; `borrower@ku.ac.th` to attempt access)
- **Preconditions:** Operator reset is complete; the Operator has provisioned `borrower2@ku.ac.th` and shared its password privately; `TAG-SNS-001` is `AVAILABLE`; both borrower accounts can sign in.
- **Synthetic Inputs:** `TAG-SNS-001`; the request ID created by `borrower2@ku.ac.th`; the primary borrower’s bearer token.
- **Numbered User Actions:**
  1. Sign in as `borrower2@ku.ac.th`, request `TAG-SNS-001`, and record the resulting request ID as `<other-request-id>`.
  2. Sign out and sign in as `borrower@ku.ac.th`. Open **My requests** and check that `<other-request-id>` is not displayed.
  3. Using the primary borrower’s token, send `GET /api/borrow-requests/my`. Check that the response contains only the primary borrower’s records and does not contain `<other-request-id>`.
  4. Using that same primary borrower token, send `POST /api/borrow-requests/<other-request-id>/checkout` with JSON body `{"dueAt":"2026-11-30T00:00:00.000Z"}`.
  5. As `borrower2@ku.ac.th`, refresh **My requests** and confirm the request is still pending.
- **Specific Expected Results:**
  - The borrower UI exposes no custodian approval controls, and the other borrower’s request is absent from the primary borrower’s personal list.
  - The direct checkout attempt returns HTTP `403 Forbidden`; the other request remains `PENDING`, and its asset remains `AVAILABLE`.
  - No request or loan state is modified by the denied attempt.

The API provides a borrower-scoped `/borrow-requests/my` list, but no by-ID borrower read route. This case verifies ownership through the supported personal list and verifies backend role enforcement by attempting a forbidden checkout; it does not imply a by-ID read endpoint exists.

### UAT-04 — State and Persistence Across Sessions

- **Case ID:** `UAT-04`
- **Linked Sprint 1 FR & AC IDs:** FR-02, FR-04, FR-05; AC-CAT-03, AC-CHK-01, AC-CHK-02, AC-DB-02
- **Related contract STS IDs:** STS-CATALOG-003, STS-CHECKOUT-001, STS-CHECKOUT-002, STS-DB-002 (planned)
- **Purpose:** Verify that the approved request and checked-out asset state persist across logout/login and a hard page refresh.
- **Role:** Borrower, then Custodian
- **Preconditions:** UAT-01 completed successfully; its request ID is known; `TAG-RPI-001` is `CHECKED_OUT` with an active loan; `TAG-DSO-001` remains `AVAILABLE`.
- **Synthetic Inputs:** UAT-01 request ID; asset tag `TAG-RPI-001`; the seeded borrower and custodian accounts.
- **Numbered User Actions:**
  1. Sign in as `borrower@ku.ac.th`, open **My requests**, and locate the UAT-01 request.
  2. Confirm its status is `APPROVED`, then sign out.
  3. Hard-refresh the page, sign in again as `borrower@ku.ac.th`, and reopen **My requests** and **Catalog**.
  4. Sign out, sign in as `custodian@ku.ac.th`, and open **Active loans**.
- **Specific Expected Results:**
  - The UAT-01 request remains present with status `APPROVED` after the borrower logs out, refreshes, and logs in again.
  - The catalog still shows `TAG-RPI-001` as `CHECKED_OUT` and `TAG-DSO-001` as `AVAILABLE`.
  - The custodian still sees the active loan for `TAG-RPI-001`; the request/loan relationship and asset status are consistent.

This case checks application state across user sessions and browser refresh; it does not claim that a Cloud Run restart was exercised.

### UAT-05 — Invalid and Unauthenticated Access

- **Case ID:** `UAT-05`
- **Linked Sprint 1 FR & AC IDs:** FR-01; NFR-02; AC-AUTH-02, AC-AUTH-03
- **Related contract STS IDs:** STS-AUTH-003, STS-AUTH-004
- **Purpose:** Verify that invalid credentials and an unauthenticated request to a protected endpoint are rejected.
- **Role:** Unauthenticated user
- **Preconditions:** The deployed URL is reachable; no valid session is required.
- **Synthetic Inputs:** Username `borrower@ku.ac.th`; deliberately invalid test-only password value `invalid-test-password`; protected path `/api/assets`; no Authorization header.
- **Numbered User Actions:**
  1. On the sign-in page, enter `borrower@ku.ac.th` and `invalid-test-password`, then submit.
  2. In the API client, send `GET /api/assets` without an Authorization header.
- **Specific Expected Results:**
  - Invalid credentials do not establish a session and return/display HTTP `401 Unauthorized`.
  - The unauthenticated catalog request returns HTTP `401 Unauthorized`; no catalog data is disclosed.

## Contract Test ID Notes

The AC and STS identifiers above follow `docs/sprints/sprint-1/contracts.md`. The contract marks `AC-REQ-04` / `STS-REQUEST-004`, `AC-REQ-05` / `STS-REQUEST-005`, and `AC-DB-02` / `STS-DB-002` as planned automated tests. Their inclusion here identifies the UAT requirement and does not assert that those automated tests already exist or pass.
