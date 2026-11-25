# Sprint 2 Engineering Contracts
Project: Theme 2 — Inventory and Borrowing System | Contract version: v2.0-draft (pre-implementation)
Sources: `docs/srs.md`, `docs/features.md`, `docs/traceability.md`, `docs/system-sds.md`, `docs/sprints/sprint-plan.md`

## Common Definition of Done (all Sprint 2 contracts)
1. All Acceptance Criteria (AC) have a passing automated test (`npm test`) executed on the submitted commit.
2. Negative, boundary, and role-authorization cases covered (`400`, `401`, `403`, `409`).
3. Failing test shown before implementation (TDD red), passing after implementation (TDD green).
4. Authorization enforced on backend middleware/services, never solely in the UI.
5. Feature branch reviewed by teammate via Pull Request into `sprint-staging` and promoted to `main`.
6. TypeScript build clean (`npx tsc --noEmit` and `npm run build`).

---

## C-06 Asset Return Processing (`F-09`)
- **Requirements:** `FR-08`, `BR-05`, `NFR-02`, `NFR-03`
- **Workflow:** Authenticated `CUSTODIAN` submits return inspection for an `ACTIVE` (or `OVERDUE`) loan → server validates loan is unreturned and linked asset is `CHECKED_OUT` → updates `LoanRecord` (`status = RETURNED`, `returnDate = now()`, `returnCondition`) and transitions `Asset.status` back to `AVAILABLE` atomically.
- **Data Layer:** Uses existing `LoanRecord` (`returnDate`, `returnCondition`, `status`) and `Asset` (`status`) fields in `prisma/schema.prisma` (no schema migration required).
- **API Definition:**
  - `POST /api/loans/:id/return` (`CUSTODIAN` only)
  - Request body: `{ "returnCondition": "string (optional, defaults to 'Good' if blank, max 500 chars)" }`
  - Responses: `200 OK` (updated loan + asset status `AVAILABLE`), `400 Bad Request` (invalid condition length), `401 Unauthorized`, `403 Forbidden` (Borrower role), `404 Not Found` (unknown loan ID), `409 Conflict` (loan already `RETURNED` or asset not `CHECKED_OUT`).
- **UI Definition:** Custodian Active Loans view provides a condition note input and **Return** action on each active loan; refreshes Active Loans and Asset Catalog upon `200 OK`, or displays global error banner on `403`/`409`.
- **Permissions:** `CUSTODIAN` role required on backend.

| AC | Observable Outcome | STS ID | Level |
| :--- | :--- | :--- | :--- |
| `AC-RET-01` | Custodian returns an active loan with custom condition notes; loan becomes `RETURNED` with `returnDate` and `returnCondition` persisted | `STS-RETURN-001` | API/DB Integration |
| `AC-RET-02` | Returning a loan transitions the linked asset's status from `CHECKED_OUT` back to `AVAILABLE` so it can be requested again | `STS-RETURN-002` | API/DB Integration |
| `AC-RET-03` | Attempting to return an already-returned loan or an asset not in `CHECKED_OUT` status returns `409 Conflict` | `STS-RETURN-003` | API/DB Boundary |
| `AC-RET-04` | Borrower attempting `POST /api/loans/:id/return` is rejected with `403 Forbidden` | `STS-RETURN-004` | API Security |

---

## C-07 Due Date and Overdue Detection (`F-10`)
- **Requirements:** `FR-09`, `FR-10`, `BR-06`, `NFR-03`
- **Workflow:**
  1. At checkout (`POST /api/loans/checkout`), if `dueDate`/`dueAt` is omitted, server calculates `dueDate = checkoutDate + 14 days`; if provided, server validates ISO date is valid and strictly after `checkoutDate`.
  2. When retrieving active loans (`GET /api/loans/active`) or borrower records (`GET /api/borrow-requests/my`), any unreturned loan (`returnDate == null`) where `now() > dueDate` is evaluated and flagged as `OVERDUE` (`BR-06`).
- **Data Layer:** Uses existing `LoanRecord.dueDate` and `LoanStatus.OVERDUE` enum in `prisma/schema.prisma` (no schema migration required).
- **API Definition:**
  - `POST /api/loans/checkout` (`CUSTODIAN`): accepts optional `dueDate` / `dueAt`; returns `400 Bad Request` if unparseable or `<= checkoutDate`.
  - `GET /api/loans/active` (`CUSTODIAN`) & `GET /api/borrow-requests/my` (`BORROWER`): returns computed/persisted `status: "OVERDUE"` and boolean `isOverdue: true` when `now() > dueDate && returnDate == null`.
- **UI Definition:** Checkout form defaults due date to `+14 days`; Custodian Active Loans and Borrower My Requests views render a red **`OVERDUE`** badge when `status === "OVERDUE"`.
- **Permissions:** Checkout and all-loans oversight restricted to `CUSTODIAN`; borrower sees only own loans (`BR-04`).

| AC | Observable Outcome | STS ID | Level |
| :--- | :--- | :--- | :--- |
| `AC-DUE-01` | Checkout without explicit due date sets `dueDate` to 14 days after `checkoutDate` | `STS-OVERDUE-001` | API/DB Integration |
| `AC-DUE-02` | Checkout with malformed or past `dueDate` (`<= checkoutDate`) is rejected with `400 Bad Request` | `STS-OVERDUE-002` | API Boundary |
| `AC-DUE-03` | Active unreturned loan whose `dueDate` is in the past is flagged with status `OVERDUE` in loan queries | `STS-OVERDUE-003` | API/DB Integration |
| `AC-DUE-04` | Returned loan past its original `dueDate` retains `RETURNED` status and is not marked `OVERDUE` | `STS-OVERDUE-004` | API/DB Boundary |

---

## C-08 Custodian Asset Status Management (`F-11`)
- **Requirements:** `FR-07`, `BR-02`, `BR-03`, `NFR-02`, `NFR-03`
- **Workflow:**
  1. Authenticated `CUSTODIAN` creates a new tracked asset (`assetTag`, `name`, `category`) → persisted with initial status `AVAILABLE`.
  2. Authenticated `CUSTODIAN` updates an existing asset's status between `AVAILABLE` and `MAINTENANCE` → persisted; assets currently `CHECKED_OUT` cannot be moved directly to `MAINTENANCE` or `AVAILABLE` (`409 Conflict`).
- **Data Layer:** Uses existing `Asset` model (`id`, `assetTag`, `name`, `category`, `status`) in `prisma/schema.prisma` (no schema migration required).
- **API Definition:**
  - `POST /api/assets` (`CUSTODIAN` only): body `{ "assetTag": "string", "name": "string", "category": "string" }` → `201 Created` (asset object), `400 Bad Request` (missing/empty fields), `409 Conflict` (duplicate `assetTag`), `403 Forbidden` (Borrower).
  - `PATCH /api/assets/:id/status` (`CUSTODIAN` only): body `{ "status": "AVAILABLE" | "MAINTENANCE" }` → `200 OK`, `400 Bad Request` (invalid target status), `404 Not Found`, `409 Conflict` (asset currently `CHECKED_OUT`), `403 Forbidden` (Borrower).
- **UI Definition:** Custodian Catalog view adds an **"Add Equipment"** form (`assetTag`, `name`, `category`) and a status toggle action (**Set Maintenance** / **Set Available**) on non-checked-out asset cards.
- **Permissions:** `CUSTODIAN` role required on backend.

| AC | Observable Outcome | STS ID | Level |
| :--- | :--- | :--- | :--- |
| `AC-AST-01` | Custodian creates a new asset with unique `assetTag`, `name`, and `category`; returns `201 Created` with status `AVAILABLE` and appears in catalog | `STS-ASSET-001` | API/DB Integration |
| `AC-AST-02` | Duplicate `assetTag` returns `409 Conflict`; missing required fields return `400 Bad Request` | `STS-ASSET-002` | API Boundary |
| `AC-AST-03` | Custodian transitions an `AVAILABLE` asset to `MAINTENANCE` (`200 OK`), and subsequent borrower request on it returns `409 Conflict` (`BR-02`) | `STS-ASSET-003` | API/DB Integration |
| `AC-AST-04` | Updating status of a `CHECKED_OUT` asset returns `409 Conflict`; Borrower calling `POST /api/assets` or `PATCH /api/assets/:id/status` returns `403 Forbidden` | `STS-ASSET-004` | API Boundary & Security |

---

## Contract Version History
| Version | Date | Change | Commit |
| :--- | :--- | :--- | :--- |
| `v2.0-draft` | 2026-11-25 | Pre-implementation Sprint 2 contracts (`C-06` to `C-08`) and STS specifications added; `F-15` deferred per `CHG-01` | *fill after commit* |