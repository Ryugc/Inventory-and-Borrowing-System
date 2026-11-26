# Lab 7 Engineering Contract Revision: CHG-03 (Checkout Due-Date Duration Window)

- **Change ID:** `CHG-03`
- **Issue / PR Reference:** Issue `#49` / PR `#51` (Merged via `9a4f5bb` into `main`)
- **Contract Version:** `v3.1-lab7` (Implemented & Verified)
- **Target Sprint 1 Feature & Requirements:** `F-05` (Custodian Checkout), `FR-04`, `FR-09`, `BR-06`
- **Accepted Sprint 1 Baseline:** Tag `v0.1.0` (`c03ff3aa1e27cf28678d1cbb3b2323c498ebf3e7`, PR `#11`)
- **Pre-Change Commit:** `1bfdad284fbfb51ee8984d0e43267f78eeeb45ae`
- **TDD Commits:** `d687361` (red test) -> `70e1c29` (implementation) -> `9a4f5bb` (merge into `main`)
- **Approval Record:** Approved by `Ryugc` on PR `#51` (`2026-11-26`)

## 1. Old vs. New Behavior Summary

- **Old Behavior (`v0.1.0` – `1bfdad2`):** `POST /api/borrow-requests/:id/checkout` validated only that `dueAt` (when supplied) was a valid date strictly after the checkout timestamp, allowing arbitrarily short (< 1 day) or arbitrarily long (> 14 days, e.g., 30 days) loan durations.
- **New Behavior (`CHG-03` / `v3.1-lab7`):** Enforces a **1-day minimum and 14-day maximum** loan duration window (`[+1 day, +14 days]`) relative to the checkout timestamp inside `inventoryService.checkout`:
  - `MIN_LOAN_MS = 1 * 24 * 60 * 60 * 1000` (1 day)
  - `MAX_LOAN_MS = 14 * 24 * 60 * 60 * 1000` (14 days)
- When `dueAt` is omitted, the service preserves the existing **14-day default** due date.
- When `dueAt` is supplied and malformed, `< checkoutTime + 1 day`, or `> checkoutTime + 14 days`, `POST /api/borrow-requests/:id/checkout` rejects the request with `400 Bad Request` before entering the database transaction—leaving `BorrowRequest`, `Asset`, and `LoanRecord` state untouched.

## 2. Change Impact Analysis

| Dimension | Impacted Artifact / Module | Impact & Rationale |
| :--- | :--- | :--- |
| **Requirement & Feature** | `FR-04`, `FR-09`, `BR-06`, `F-05` | Enforces bounded 1-to-14 day loan duration window at Custodian checkout. |
| **Specification Docs** | `docs/sprints/lab7-chg03-contract.md`, `docs/traceability.md` | Records `CHG-03`, `STS-CHECKOUT-006`, TDD commits (`d687361`, `70e1c29`), and PR `#51` (`9a4f5bb`) at `v3.1-lab7`. |
| **Service Layer** | `src/services/inventoryService.ts` (`inventoryService.checkout`) | Validates `dueAt` against `[now + 1d, now + 14d]` prior to transaction execution; throws `400 Bad Request` on invalid or out-of-window values. |
| **Automated Tests** | `tests/api/borrow-quota.test.ts` (`STS-CHECKOUT-006`) | Verifies `400` rejection for out-of-window due dates (> 14 days) while preserving valid in-window checkout (`201`). |
| **Roles & RBAC** | `src/middleware/auth.ts`, `BR-03` (`STS-AUTH-005`) | **Unchanged** — `BORROWER` checkout attempts continue returning `403 Forbidden` (verified locally and via deployed UAT evidence `B-12`). |
| **Persistence & Migrations** | `prisma/schema.prisma` (`LoanRecord.dueAt`) | **No Migration Required** — existing `dueAt` `DateTime` field stores the bounded due date. |
| **Regression Safety** | Full Vitest Suite (`15/15` files, `50/50` tests) & `tsc --noEmit` | All existing authentication, catalog, request, checkout, overdue, return, admin, and Docker tests pass with `0` TypeScript errors. |

## 3. Revised Contract & Software Test Specification (F-05 / Checkout Revision)

- **Endpoint:** `POST /api/borrow-requests/:id/checkout` (Authenticated `CUSTODIAN` only)
- **Inputs & Preconditions:** Valid Bearer JWT with `role === "CUSTODIAN"`; `BorrowRequest` exists with `status === "PENDING"`; optional JSON body `{ "dueAt": "<ISO-8601 timestamp>" }`.
- **Execution Rules:**
  1. If `dueAt` is omitted, default `dueDate = now + 14 days`.
  2. If `dueAt` is provided, parse timestamp (`400 Bad Request` if `NaN`) and enforce `now + 1 day <= dueDate <= now + 14 days` (`400 Bad Request` otherwise).
  3. Execute `BorrowRequest` approval, `Asset` status transition to `CHECKED_OUT`, and `LoanRecord` creation inside one atomic Prisma transaction.

### Acceptance Criteria & STS Mapping

| AC ID | STS Test ID | Level | Preconditions & Input | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **AC-CHK-06** | `STS-CHECKOUT-006` | API/DB Boundary | Custodian checks out a `PENDING` request with `dueAt` > 14 days (e.g., `+15 days`) or < 1 day. | `400 Bad Request`; request remains `PENDING`, asset remains `AVAILABLE`, no `LoanRecord` created. |
| **AC-AUTH-05** | `STS-AUTH-005` | API & Deployed UAT (`B-12`) | Authenticated `BORROWER` calls `POST /api/borrow-requests/:id/checkout` with a valid 5-day `dueAt`. | `403 Forbidden`; role guard blocks checkout before validation/transaction. |
