# Sprint 1 Engineering Contracts
**Project:** Theme 2 – Inventory and Borrowing System | **Contract version:** v1.0
Sources: `docs/srs.md`, `docs/features.md`, `docs/traceability.md`, `docs/system-sds.md`.
Status legend: **Existing** = test exists in repo. **Planned** = test still to be written (see Gaps).

## Common Definition of Done (all contracts)
1. All AC for the contract have a passing automated test (`npm test`), run on the submitted commit.
2. Negative and boundary cases covered (401, 403, 409).
3. Failing test shown before implementation (TDD red), passing after (green).
4. Authorization enforced on the backend, not only in the UI.
5. Feature branch reviewed by teammate via PR into `sprint-staging`; docs updated.
6. Type check clean (`npx tsc --noEmit`).

---

## C-01 Authentication and Role Access (F-01, F-02)
**Requirements:** FR-01, BR-03, NFR-01, NFR-02
**Workflow:** credentials → server verifies bcrypt hash → token with user ID and role → middleware validates token and role on every protected route.
**Business rules:** only `CUSTODIAN` may check out or list all loans (BR-03).
**Data:** `User(id, email UK, passwordHash, role BORROWER|CUSTODIAN)`.
**API:** `POST /api/auth/login` (public) → 200 `{token, role}` / 401.
**UI:** sign-in form with email and password; demo-account buttons; role shown after login; sign out.
**Validation/errors:** missing or invalid credentials → 401; missing/invalid token → 401; wrong role → 403.

| AC | Observable outcome | Test | Status |
|----|-------------------|------|--------|
| AC-AUTH-01 | Valid Borrower and Custodian login returns session with role | STS-AUTH-001, STS-AUTH-002 | Existing |
| AC-AUTH-02 | Invalid credentials return 401 | STS-AUTH-003 | Existing |
| AC-AUTH-03 | Protected endpoint without token returns 401 | STS-AUTH-004 | Existing |
| AC-AUTH-04 | Borrower calling checkout or all-loans endpoint returns 403 | STS-AUTH-005, STS-AUTH-006 | Existing |
| AC-AUTH-05 | Stored passwords are bcrypt hashes, never plaintext | STS-AUTH-007 | Planned |

## C-02 Asset Catalog Browsing (F-03)
**Requirements:** FR-02
**Workflow:** authenticated user requests catalog → list returned with tag, name, category, status.
**Data:** `Asset(id, assetTag UK, name, category, status AVAILABLE|CHECKED_OUT|MAINTENANCE)`.
**API:** `GET /api/assets` (authenticated) → 200 / 401.
**UI:** card list with status badge; "Request" button for Borrowers; refresh.
**Permissions:** Borrower and Custodian.

| AC | Observable outcome | Test | Status |
|----|-------------------|------|--------|
| AC-CAT-01 | Authenticated users retrieve the catalog | STS-CATALOG-001 | Existing |
| AC-CAT-02 | Unauthenticated request returns 401 | STS-CATALOG-002 | Existing |
| AC-CAT-03 | Each entry has tag, name, category, status | STS-CATALOG-003 | Existing |

## C-03 Borrow Request and Personal Records (F-04, F-06)
**Requirements:** FR-03, FR-05, BR-01, BR-02, BR-04
**Workflow:** Borrower requests `AVAILABLE` asset → `BorrowRequest` created `PENDING`. Borrower lists own requests.
**Business rules:** unavailable asset → 409; second pending request on the same asset → 409 (no overlapping requests); borrower reads own records only.
**Data:** `BorrowRequest(id, assetId FK, borrowerId FK, status PENDING|APPROVED|REJECTED|CANCELLED, requestDate, resolvedDate)`.
**API:** `POST /api/borrow-requests` (BORROWER) → 201 / 409 / 403; `GET /api/borrow-requests/my` (BORROWER) → 200.
**UI:** Request button on catalog; "My requests" tab with status badge; error banner on 409.

| AC | Observable outcome | Test | Status |
|----|-------------------|------|--------|
| AC-REQ-01 | Request for available asset returns 201 and appears in My requests | STS-REQUEST-001 | Existing |
| AC-REQ-02 | Request for unavailable asset returns 409 | STS-REQUEST-002 | Existing |
| AC-REQ-03 | Concurrent duplicate requests do not create overlapping requests | STS-REQUEST-003 | Existing |
| AC-REQ-04 | Borrower sees only own requests | STS-REQUEST-004 | Planned |
| AC-REQ-05 | Borrower reading another borrower's record gets 403 | STS-REQUEST-005 | Planned |

## C-04 Custodian Checkout and Loan Oversight (F-05, F-07)
**Requirements:** FR-04, FR-06, BR-01, BR-02, BR-03
**Workflow:** Custodian approves `PENDING` request with due date → request `APPROVED`, `LoanRecord` `ACTIVE` created, asset `CHECKED_OUT`.
**Business rules:** asset must be `AVAILABLE` at checkout else 409; custodian only.
**Data:** `LoanRecord(id, assetId, borrowerId, custodianId, checkoutDate, dueDate, returnDate?, returnCondition?, status)`.
**API:** `POST /api/loans/checkout` (CUSTODIAN) → 201 / 403 / 409; `GET /api/loans/active` (CUSTODIAN) → 200 / 403.
**UI:** approval queue with "Approve / Checkout"; active loans list.

| AC | Observable outcome | Test | Status |
|----|-------------------|------|--------|
| AC-CHK-01 | Custodian approval creates an active loan | STS-CHECKOUT-001 | Existing |
| AC-CHK-02 | Asset status becomes `CHECKED_OUT` | STS-CHECKOUT-002 | Existing |
| AC-CHK-03 | Checkout of unavailable asset returns 409 | STS-CHECKOUT-003 | Existing |
| AC-CHK-04 | Custodian lists all active loans | STS-CHECKOUT-004 | Planned |

## C-05 Persistence and Seed Data (F-08)
**Requirements:** NFR-03
**Data:** Prisma schema and migrations; seed script creates `borrower@ku.ac.th`, `custodian@ku.ac.th` and three assets.
**Validation:** seed is repeatable on a fresh database.

| AC | Observable outcome | Test | Status |
|----|-------------------|------|--------|
| AC-DB-01 | Fresh setup plus seed yields the demo accounts and catalog | STS-DB-001 | Planned |
| AC-DB-02 | A created request/loan survives app restart | STS-DB-002 | Planned |

## Gaps to close before submission
- Borrower access to another borrower's record (spec requires this test): add STS-REQUEST-005.
- Password hashing (NFR-01) and persistence (NFR-03) have no test yet.
- Update this status column to "Existing" with test file names once each test is merged.

## Version history
| Version | Date | Change | Commit |
|---------|------|--------|--------|
| v0.1 | | Contracts first drafted | `<hash>` |
| v1.0 | | Aligned with implemented STS IDs | `<hash>` |
