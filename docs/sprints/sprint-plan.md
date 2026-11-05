# Three-Sprint Plan
**Project:** Theme 2 – Inventory and Borrowing System | **Version:** v0.1 (draft)
Feature IDs refer to `docs/features.md`. Requirement IDs refer to `docs/traceability.md` (FR-07 onward are proposed).

## 1. Timeline

| Sprint | Window | Hard deadline | Related assessments |
|--------|--------|---------------|---------------------|
| 1 | 29 Oct – 8 Nov | Deliverable 1, 8 Nov | Lab 5 workshop (3, 5 Nov) |
| 2 | 9 – 22 Nov | Deliverable 2, 29 Nov | Lab 5 due 15 Nov, Lab 6 UAT 10–22 Nov |
| 3 | 23 Nov – 13 Dec | Final delivery, 13 Dec | Lab 7 due 29 Nov; exams 1–11 Dec |

Exam period (1–11 Dec) is reserved for fixes and submission prep only. Sprint 3 feature work targets completion by 29 Nov.

## 2. Sprint 1: Small deployable product
**Goal:** Working vertical slice with authentication, authorization, persistence, a borrow-to-checkout workflow, a business-rule rejection and access tests.

| Feature | Requirements |
|---------|--------------|
| F-01 Authentication and Session | FR-01, NFR-01 |
| F-02 Role-Based Access Control and Ownership | BR-03, BR-04, NFR-02 |
| F-03 Asset Catalog Viewing | FR-02 |
| F-04 Borrow Request Submission | FR-03, BR-01, BR-02 |
| F-05 Custodian Checkout | FR-04, BR-01, BR-02, BR-03 |
| F-06 Borrower Personal Requests and Loans | FR-05, BR-04 |
| F-07 Custodian Loan and Request Management View | FR-06, BR-03 |
| F-08 Persistence and Seed Data | NFR-03 |

**Demo sequence:** borrower logs in → views catalog → requests asset → custodian checks out → second request for same asset returns 409 → borrower attempts checkout and gets 403 → borrower requests another borrower's loan and gets 403.

**Out of scope for Sprint 1:** return, due dates, search, reports, Docker/GCP (Lab 5).

## 3. Sprint 2: Core expansion
**Goal:** Complete the loan lifecycle (return, due date, overdue) and deploy the integrated release.

| Feature | Requirements |
|---------|--------------|
| F-09 Asset Return Processing | FR-08, BR-05 |
| F-10 Due Date and Overdue Status | FR-09, FR-10, BR-06 |
| F-11 Custodian Asset Status Management | FR-07 |
| F-15 Request Rejection and Cancellation (proposed, pending team decision) | FR-13, FR-14 |
| Lab 5 work: Docker, CI/CD, GCP deployment | NFR-04 |

**Also in this window:** Lab 6 cross-team UAT (fix at least one accepted defect with a regression test).

## 4. Sprint 3: Completion and hardening
**Goal:** Finish remaining features, harden failure handling and authorization, regression-test and release.

| Feature | Requirements |
|---------|--------------|
| F-12 Search and Category Filtering | FR-11 |
| F-13 Inventory Utilization Report | FR-12 |
| F-14 Deployment Hardening and regression suite | NFR-04 |
| Lab 7 change request (changes an existing rule, e.g. loan duration limit in F-10) | BR-06 |

**By 29 Nov:** Sprint 3 contracts written, F-12 implemented, remaining-work list recorded. **1–13 Dec:** F-13 completion if needed, bug fixes, final report and demo video.

## 5. Dependencies

| Feature | Depends on |
|---------|------------|
| F-02 | F-01 |
| F-04, F-06, F-07 | F-01, F-02, F-03, F-08 |
| F-05 | F-04 |
| F-09, F-10 | F-05 |
| F-15 | F-04, F-05 |
| F-13 | F-09 |
| F-12 | F-03 |
| F-14 | all features |

## 6. Feasibility and risks

| Risk | Mitigation |
|------|-----------|
| Sprint 1 has a 10-day window and includes auth | Keep seeded accounts only, no registration; auth built first |
| Sprint 2 overlaps Lab 5 and Lab 6 | Dockerize in Sprint 1 workflow where possible; lab work kept in separate PRs and evidence |
| Exams from 1 Dec | Sprint 3 features done by 29 Nov |
| Lab 7 needs an approved change to existing behavior | Request approval from instructor/TA early (during Sprint 2) |
| Race condition on concurrent requests (BR-01) | Database unique constraint or transaction, tested in Sprint 1 |

## 7. Change log
- v0.1: initial plan. Record justified scope changes here instead of editing history.
