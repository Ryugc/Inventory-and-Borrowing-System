# Lab 7 Engineering Contract Revision: CHG-03 (Borrower Concurrent Quota Limit)

- **Change ID:** `CHG-03`
- **Issue Reference:** `#49`
- **Contract Version:** `v3.1-lab7` (pre-implementation)
- **Target Sprint 1 Feature & Requirements:** `F-04` (Borrow Request Submission), `FR-03`, `BR-01`, `BR-07` (new)
- **Accepted Sprint 1 Baseline:** Tag `v0.1.0` (`c03ff3a`, PR #11)
- **Pre-Change Baseline:** Tag `v0.3.0-rc1` on `main` (`72fb413`)
- **Approval Record:** Team Top 2 (Grittapob Chutitas & Moe Thauk Ko) on `2026-11-26` (Instructor/TA pre-approval waived per Ajarn Suthep Madarasmi's Lab 7 Spec Sheet Change announcement)

## 1. Old vs. New Behavior Summary

- **Old Behavior (`v0.1.0` – `v0.3.0-rc1`):** `POST /api/borrow-requests` validates only single-asset exclusivity (`BR-01`) and asset availability (`BR-02`), allowing an authenticated `BORROWER` to hold unlimited concurrent `PENDING` requests and unreturned loans across distinct assets.
- **New Behavior (`CHG-03` / `BR-07`):** Enforces a per-borrower concurrent obligation limit of **at most 2 active obligations**:
  `activeObligations(borrowerId) = count(BorrowRequest where status == PENDING) + count(LoanRecord where returnDate == null)` (including both `ACTIVE` and `OVERDUE` unreturned loans).
  - If `activeObligations < 2` (`0` or `1`) and target asset is `AVAILABLE`, `POST /api/borrow-requests` succeeds (`201 Created`).
  - If `activeObligations >= 2` (boundary: `2`), `POST /api/borrow-requests` is rejected with `409 Conflict` (`{ "error": "Maximum concurrent borrowing limit (2 active/pending items) reached" }`).
  - Returning an active loan (`POST /api/loans/:id/return`, `F-09`) sets `returnDate != null`, reducing `activeObligations` by 1 and freeing a slot.

## 2. Change Impact Analysis

| Dimension | Impacted Artifact / Module | Impact & Rationale |
| :--- | :--- | :--- |
| **Requirement & Feature** | `FR-03`, `BR-07` (extends `BR-01`), `F-04` | Adds per-borrower cap of 2 concurrent obligations (`PENDING` requests + unreturned loans) to Sprint 1 borrow request submission. |
| **Specification Docs** | `docs/sprints/lab7-chg03-contract.md`, `docs/srs.md`, `docs/features.md`, `docs/system-sds.md`, `docs/traceability.md` | Records `CHG-03`, `BR-07`, acceptance criteria `AC-QUOTA-01`–`03`, and test IDs `STS-QUOTA-001`–`003` at version `v3.1-lab7`. |
| **API & Service Layer** | `src/services/inventoryService.ts` (`createBorrowRequest`), `src/controllers/borrowRequestController.ts` | Inside the existing atomic Prisma transaction, counts caller's `PENDING` requests and unreturned `LoanRecord`s (`returnDate: null`); throws `409 Conflict` when count `>= 2`. |
| **UI & Callers** | `public/app.js` (Borrower Catalog request handler) | **No UI layout change required** — existing `POST /api/borrow-requests` error handler already renders server `409` JSON error messages in the global alert banner. |
| **Roles & Ownership** | `src/middleware/auth.ts`, `BR-03`, `BR-04` | **Unchanged** — `BORROWER`-only access (`401`/`403`) and caller-scoped ID lookup (`req.user.id`) remain enforced on the backend. |
| **Persistence & Migrations** | `prisma/schema.prisma` (`BorrowRequest`, `LoanRecord`) | **Not Applicable (No Migration)** — existing `BorrowRequest.status` and `LoanRecord.returnDate` columns support exact quota counting; historical `RETURNED` records are excluded naturally. |
| **Preserved Sprint 1 Behavior** | `F-01`–`F-08` (`tests/api/borrow-request.test.ts`, `checkout.test.ts`, `auth.test.ts`, `custodian.test.ts`) | Single-asset exclusivity (`BR-01`), unavailable/maintenance `409` (`BR-02`), Custodian checkout (`F-05`), and RBAC (`403`) remain unchanged and protected by existing regression tests. |

## 3. Revised Contract & Software Test Specification (C-03 / F-04 Revision)

- **Endpoint:** `POST /api/borrow-requests` (Authenticated `BORROWER` only)
- **Inputs & Preconditions:** Valid Bearer JWT with `role === "BORROWER"`; JSON body `{ "assetId": "<uuid>" }`.
- **Execution Rules:**
  1. Verify target `Asset` exists (`404 Not Found` otherwise) and has `status === "AVAILABLE"` (`409 Conflict`, `BR-02`).
  2. Verify target `Asset` has no existing `PENDING` `BorrowRequest` (`409 Conflict`, `BR-01`).
  3. Count caller's `PENDING` `BorrowRequest` rows plus `LoanRecord` rows where `returnDate === null`. If total `>= 2`, reject with `409 Conflict` (`"Maximum concurrent borrowing limit (2 active/pending items) reached"`).
  4. Execute all checks and `BorrowRequest` creation inside one atomic Prisma transaction.

### Acceptance Criteria & STS Mapping

| AC ID | STS Test ID | Level | Preconditions & Input | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **AC-QUOTA-01** | `STS-QUOTA-001` | API/DB Integration | Borrower has `1` `PENDING` request and `0` active loans; calls `POST /api/borrow-requests` for a 2nd `AVAILABLE` asset. | `201 Created`; 2nd `BorrowRequest` persisted with `status: "PENDING"`. |
| **AC-QUOTA-02** | `STS-QUOTA-002` | API/DB Boundary | Borrower has `2` active obligations (`1 PENDING` request + `1 ACTIVE` loan); calls `POST /api/borrow-requests` for a 3rd `AVAILABLE` asset. | `409 Conflict` with quota error message; no 3rd request persisted. |
| **AC-QUOTA-03** | `STS-QUOTA-003` | Cross-Feature API/DB | Borrower at quota limit (`2` active loans) has `1` loan returned via `POST /api/loans/:id/return`, then calls `POST /api/borrow-requests` for an `AVAILABLE` asset. | Return returns `200 OK`; subsequent borrow request succeeds with `201 Created`. |
