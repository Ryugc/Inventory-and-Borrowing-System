# Feature Inventory
**Project:** Theme 2 – Inventory and Borrowing System | **Version:** v0.1 (draft)

Sprint 1 = F-01 to F-08 (vertical slice: login → browse → request → checkout, with rejections and access tests).

| ID | Feature | Scope | Sprint |
|----|---------|-------|--------|
| F-01 | Authentication and Session | Email/password login, logout, current-user identity, session token with role (`BORROWER`/`CUSTODIAN`), bcrypt/Argon2 password hashing | 1 |
| F-02 | Role-Based Access Control and Ownership | Server-side middleware: 401 unauthenticated, 403 wrong role, 403 access to another borrower's records | 1 |
| F-03 | Asset Catalog Viewing | List assets (tag, name, category, status) for both roles | 1 |
| F-04 | Borrow Request Submission | Borrower requests an `AVAILABLE` asset; reject non-available asset or duplicate pending request (409) | 1 |
| F-05 | Custodian Checkout | Custodian approves pending request, creates active loan, asset → `CHECKED_OUT`; reject unavailable asset (409) | 1 |
| F-06 | Borrower Personal Requests and Loans | Borrower views own requests and active loans only | 1 |
| F-07 | Custodian Loan and Request Management View | Custodian views all pending requests and active loans | 1 |
| F-08 | Persistence and Seed Data | Relational DB schema, migrations, seed accounts and catalog, data survives restart | 1 |
| F-09 | Asset Return Processing | Custodian records return and condition notes, loan closed, asset → `AVAILABLE` | 2 |
| F-10 | Due Date and Overdue Status | Due date on checkout, overdue detection and display | 2 |
| F-11 | Custodian Catalog Management | Create assets, update availability status | 2 |
| F-12 | Search and Category Filtering | Search by name/tag, filter by category and status | 3 |
| F-13 | Inventory Utilization Report | Counts by status/category, utilization summary for custodians | 3 |
| F-14 | Deployment Hardening | Failure handling, regression suite, Docker/CI/GCP configuration (with Lab 5) | 3 |

## Dependencies
- F-02 depends on F-01. F-04 to F-07 depend on F-01, F-02, F-03, F-08.
- F-05 depends on F-04. F-09 and F-10 depend on F-05. F-13 depends on F-09.
