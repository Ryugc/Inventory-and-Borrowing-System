# Feature Inventory
**Project:** Theme 2 – Inventory and Borrowing System | **Version:** v3.0

| ID | Feature | Scope | Sprint | Current Status |
|----|---------|-------|--------|----------------|
| F-01 | Authentication and Session | Email/password authentication, session token with role, logout, bcrypt password hashing | 1 | Implemented |
| F-02 | Role-Based Access Control and Ownership | Server-side role and ownership enforcement | 1 | Implemented |
| F-03 | Asset Catalog Viewing | Authenticated Borrower and Custodian catalog access | 1 | Implemented |
| F-04 | Borrow Request Submission | Borrower requests an `AVAILABLE` asset; reject unavailable or duplicate pending requests | 1 | Implemented |
| F-05 | Custodian Checkout | Custodian checks out a pending request and creates a loan | 1 | Implemented |
| F-06 | Borrower Personal Requests and Loans | Borrower views their own requests and loan information | 1 | Implemented |
| F-07 | Custodian Loan and Request Management View | Custodian views pending requests and active loans | 1 | Implemented |
| F-08 | Persistence and Seed Data | PostgreSQL persistence, schema, and seed records | 1 | Implemented |
| F-09 | Asset Return Processing | Custodian records return and condition; loan closes and asset becomes `AVAILABLE` | 2 | Implemented |
| F-10 | Due Date and Overdue Status | Assign due dates and identify/display overdue loans | 2 | Implemented; configurable maximum duration under `CHG-02` is planned |
| F-11 | Custodian Catalog Management | Custodian creates assets and updates eligible asset status | 2 | Implemented |
| F-12 | Search and Category Filtering | Search by name/tag and filter by category/status (`FR-11`, `C-09`) | 3 | Implemented; 49/49 Vitest pass reported |
| F-13 | Inventory Utilization Report | Custodian report of status/category counts and active/overdue loans (`FR-12`, `C-10`) | 3 | Planned — Not Yet Executed; target 2026-11-29 |
| F-14 | Deployment Hardening | Docker/CI regression baseline and runtime hardening (`NFR-04`, `C-11`) | 3 | Lab 5 CI/CD passed; C-11 JSON error envelope and startup checks Planned — Not Yet Executed; target 2026-11-29 |
| F-15 | Request Rejection and Cancellation | Custodian rejects pending requests; owner Borrower cancels pending requests (`FR-13`, `FR-14`, `C-12`) | 2 (deferred to Sprint 3 via `CHG-01`) | Planned — Not Yet Executed; target 2026-12-03 |

## Dependencies

- F-02 depends on F-01.
- F-04 to F-07 depend on F-01, F-02, F-03, and F-08.
- F-05 depends on F-04. F-09 and F-10 depend on F-05.
- F-11 depends on F-03. F-12 depends on F-03. F-13 depends on F-09.
- F-15 depends on F-04 and F-05. F-14 depends on the other features.

## Approved and Proposed Changes

- `CHG-01`: F-15 was deferred from Sprint 2; rejection and cancellation remain planned under C-12.
- `CHG-02`: Configurable maximum loan duration under BR-06 is planned, pending Lab 7 approval; target 2026-12-06.
