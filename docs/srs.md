# Software Requirements Specification (SRS)
## Theme 2: Inventory and Borrowing System
**Course:** CPE 334 Software Engineering in the Age of AI Agents  
**Semester:** 1/2026  
**Version:** v3.0 (Updated for Sprint 2-3 & Approved Scope Changes)
**Repository:** https://github.com/Ryugc/Inventory-and-Borrowing-System  

---

## 1. Problem Statement & System Context
Academic departments and laboratory facilities regularly lend physical equipment—such as microcontrollers, development boards, sensors, oscilloscopes, and cameras—to students and faculty. Informal tracking via spreadsheets and paper clipboards leads to double-booking exclusive items, lack of condition accountability, and lost hardware.

The Inventory and Borrowing System is a centralized web platform that gives borrowers real-time visibility into equipment availability and handles request workflows, while custodians authorize checkouts, oversee active loans, and verify returned equipment.

---

## 2. Actors & Responsibilities
- **Borrower (Student / Department Member):**
  - Authenticates using departmental email credentials.
  - Browses and filters the catalog of departmental equipment and checks availability status.
  - Submits borrow requests for items marked as `AVAILABLE` and cancels own `PENDING` requests (`CHG-01`).
  - Views personal active requests, active loans, due dates, overdue alerts, and borrowing history.
- **Custodian (Equipment Administrator / Lab Staff):**
  - Authenticates with administrative custodian privileges.
  - Creates new assets, manages asset availability status (`AVAILABLE`, `MAINTENANCE`), and views aggregate utilization metrics.
  - Reviews incoming borrow requests, authorizes physical handoffs (checkout with due date), or rejects `PENDING` requests (`CHG-01`).
  - Inspects equipment on return, logs condition notes, and closes loans.

---

## 3. Product Scope & Exclusions
- **In-Scope (Sprints 1–3):**
  - Exclusive individual item tracking by unique asset tags.
  - Role-based access control (Borrower vs. Custodian) at the API and database levels.
  - **Sprint 1:** Asset catalog browsing, borrow request submission, custodian checkout approval, and concurrency conflict rejection (HTTP 409).
  - **Sprint 2:** Equipment return processing, condition notes, loan duration limits, overdue detection, and custodian asset management.
  - **Sprint 3:** Catalog search and filtering (`F-12`), custodian utilization metrics (`F-13`), containerized deployment hardening (`F-14`), and borrow request rejection/cancellation (`F-15`, deferred from Sprint 2 via `CHG-01`).
- **Explicit Exclusions:**
  - Self-registration, public password recovery, and external OAuth2 providers (synthetic seed accounts are used).
  - Financial deposits, rental fees, and monetary penalty calculations.
  - Hardware barcode/RFID scanners and external repair vendor integrations.

---

## 4. Functional Requirements (FR)
- **FR-01 (Authentication & Identity):** The system shall authenticate users via email and password, returning an authenticated session bearing the user's role (`BORROWER` or `CUSTODIAN`).
- **FR-02 (Catalog Browsing):** The system shall allow authenticated Borrowers and Custodians to retrieve the catalog of tracked equipment, showing asset tag, name, category, and availability status.
- **FR-03 (Borrow Request Submission):** The system shall allow an authenticated Borrower to submit a loan request for a designated asset whose current status is `AVAILABLE`.
- **FR-04 (Custodian Checkout Execution):** The system shall allow an authenticated Custodian to approve a pending request, transitioning the asset status to `CHECKED_OUT` and creating an active loan record.
- **FR-05 (Personal Loan Inspection):** The system shall allow an authenticated Borrower to retrieve only their own pending requests and active loan records.
- **FR-06 (All Loans Oversight):** The system shall allow an authenticated Custodian to retrieve all active loans and pending requests across the entire department.
- **FR-07 (Custodian Asset Management):** The system shall allow an authenticated Custodian to create new tracked assets and update an asset's availability status (`AVAILABLE`, `MAINTENANCE`), rejecting updates to `CHECKED_OUT` assets with HTTP 409 (`F-11`, `C-08`).
- **FR-08 (Asset Return & Condition Logging):** The system shall allow an authenticated Custodian to process the return of an active loan, recording return timestamp and condition notes and restoring the asset status to `AVAILABLE` (`F-09`, `C-06`).
- **FR-09 (Due Date Assignment):** The system shall assign and persist a mandatory `dueDate` on every `LoanRecord` upon Custodian checkout (`F-10`, `C-07`).
- **FR-10 (Overdue Detection & Display):** The system shall automatically identify and display unreturned loans whose `dueDate` has passed as `OVERDUE` (`F-10`, `C-07`).
- **FR-11 (Catalog Search & Filtering):** The system shall allow authenticated Borrowers and Custodians to query `GET /api/assets` with optional `q`, `category`, and `status` filters. `q` matches `name` or `assetTag` as a case-insensitive substring; category matches exactly without case sensitivity; status is one of `AVAILABLE`, `CHECKED_OUT`, or `MAINTENANCE`, with invalid values returning HTTP 400. Combined filters intersect (`F-12`, `C-09`).
- **FR-12 (Inventory Utilization Report):** The system shall allow authenticated Custodians to retrieve total assets, counts by `AVAILABLE`, `CHECKED_OUT`, and `MAINTENANCE`, category breakdowns, and active/overdue loan totals via `GET /api/reports/utilization` (`F-13`, `C-10`).
- **FR-13 (Custodian Request Rejection — `CHG-01`):** The system shall allow an authenticated Custodian to reject a `PENDING` borrow request via `POST /api/borrow-requests/:id/reject`, transitioning its status to `REJECTED` while keeping the asset `AVAILABLE` (`F-15`, `C-12`).
- **FR-14 (Borrower Request Cancellation — `CHG-01`):** The system shall allow an authenticated Borrower to cancel their own `PENDING` borrow request via `POST /api/borrow-requests/:id/cancel`, transitioning its status to `CANCELLED` (`F-15`, `C-12`).

---

## 5. Business Rules (BR)
- **BR-01 (Asset Exclusivity):** Each tracked asset is an exclusive entity identified by a unique asset tag. An asset cannot have more than one active loan or pending request concurrently.
- **BR-02 (Unavailable Asset Guard):** The system shall reject any borrow request or checkout operation targeted at an asset whose status is not `AVAILABLE` with HTTP 409 Conflict.
- **BR-03 (Custodian Authorization Enforcement):** Only users authenticated with the `CUSTODIAN` role may execute checkouts, process returns, update item statuses, view utilization reports, reject requests, or view all borrower loan records. Any borrower attempting these actions shall be rejected with HTTP 403 Forbidden.
- **BR-04 (Record Privacy & Ownership):** A Borrower can view or cancel only their own borrowing records. Attempting to access or cancel another user's record shall return HTTP 403 Forbidden.
- **BR-05 (Return Role & State Guard):** Only an authenticated `CUSTODIAN` may process a return, and only an active loan whose asset is currently `CHECKED_OUT` may be returned (non-checked-out or already-returned loans return HTTP 409) (`F-09`, `C-06`).
- **BR-06 (Overdue Classification & Duration Policy):** A loan is classified as `OVERDUE` whenever `returnDate == null` and `now > dueDate`. *(Proposed rule change `CHG-02` for configurable maximum loan duration under `BR-06` awaits Lab 7 instructor/TA sign-off prior to implementation; target 2026-12-06.)*

---

## 6. Non-Functional Requirements (NFR)
- **NFR-01 (Password Security):** All user credentials must be stored using salted cryptographic hashing (bcrypt). Plaintext passwords must never be stored in the database or written to application logs.
- **NFR-02 (Backend Access Protection):** Unauthenticated API requests to protected endpoints must be rejected with HTTP 401 Unauthorized. Requests lacking the required role must be rejected with HTTP 403 Forbidden. Client-side UI controls must not be the sole boundary of authorization.
- **NFR-03 (Data Persistence Integrity):** All asset and loan state transitions must persist to a PostgreSQL relational database and survive backend application or container restarts.
- **NFR-04 (Containerized Deployment, Runtime Hardening & CI/CD):** The application shall run in a multi-stage Docker container backed by PostgreSQL, validate required environment configuration at startup without leaking secrets, return standardized JSON error envelopes (`400`/`404`/`500`) without stack traces, and pass automated regression tests in GitHub Actions CI/CD (`F-14`, `C-11`, Lab 5).

---

## 7. Architecture & Design Decisions
1. **Granularity Model:** Individual asset-tag tracking rather than bulk inventory quantities to enforce strict race-condition handling and exclusive checkout.
2. **Session Security:** Token-based session authentication with role validation middleware executed on every protected route.
3. **Deterministic Seeding:** Predefined test credentials (`borrower@ku.ac.th`, `custodian@ku.ac.th`) and equipment records generated via Prisma seed scripts against PostgreSQL 16.
