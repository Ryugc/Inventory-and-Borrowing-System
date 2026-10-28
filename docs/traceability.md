# Requirements-to-Features Traceability Matrix
**Version:** v0.1 (draft) | Verification columns (AC / test / result) are filled in per feature contract.

## 1. Baseline requirements (in srs.md)

| Req | Summary | Feature(s) | Sprint |
|-----|---------|-----------|--------|
| FR-01 | Email/password auth, role in session | F-01 | 1 |
| FR-02 | View catalog | F-03 | 1 |
| FR-03 | Submit borrow request for `AVAILABLE` asset | F-04 | 1 |
| FR-04 | Custodian checkout, creates loan | F-05 | 1 |
| FR-05 | Borrower views own requests/loans | F-06 | 1 |
| FR-06 | Custodian views all loans/requests | F-07 | 1 |
| BR-01 | Asset exclusivity (one active loan/request) | F-04, F-05 | 1 |
| BR-02 | Unavailable asset rejected, 409 | F-04, F-05 | 1 |
| BR-03 | Custodian-only operations, else 403 | F-02, F-05, F-07 | 1 |
| BR-04 | Borrower sees only own records, else 403 | F-02, F-06 | 1 |
| NFR-01 | Password hashing | F-01 | 1 |
| NFR-02 | 401/403 enforced on backend | F-02 | 1 |
| NFR-03 | Persistence across restart | F-08 | 1 |

## 2. Gaps: Sprint 2–3 scope has no requirements yet
srs.md §3 promises these, but no FR/BR/NFR covers them. **Proposed IDs to add to srs.md:**

| Proposed | Summary | Feature(s) | Sprint |
|----------|---------|-----------|--------|
| FR-07 | Custodian creates assets and updates availability status | F-11 | 2 |
| FR-08 | Custodian records return with condition notes | F-09 | 2 |
| FR-09 | System calculates due date at checkout | F-10 | 2 |
| FR-10 | System detects and displays overdue loans | F-10 | 2 |
| FR-11 | Search and filter catalog by name, tag, category, status | F-12 | 3 |
| FR-12 | Custodian views inventory utilization report | F-13 | 3 |
| BR-05 | Only a custodian can process a return; only `CHECKED_OUT` assets can be returned | F-09 | 2 |
| BR-06 | Loan is overdue when current date > due date and not returned | F-10 | 2 |
| NFR-04 | App is containerized, configured by env vars, deployable via CI/CD | F-14 | 3 |

## 3. Coverage check
- Every baseline FR/BR/NFR maps to at least one feature.
- Every feature F-01 to F-14 has at least one requirement (after the proposed additions).
