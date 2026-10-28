# Software Requirements Specification (SRS)
## Theme 2: Inventory and Borrowing System
**Course:** CPE 334 Software Engineering in the Age of AI Agents  
**Semester:** 1/2026  
**Repository:** https://github.com/Ryugc/Inventory-and-Borrowing-System  

---

## 1. Problem Statement & System Context
Academic departments and laboratory facilities regularly lend physical equipment—such as microcontrollers, development boards, sensors, oscilloscopes, and cameras—to students and faculty. Informal tracking via spreadsheets and paper clipboards leads to double-booking exclusive items, lack of condition accountability, and lost hardware.

The Inventory and Borrowing System is a centralized web platform that gives borrowers real-time visibility into equipment availability and handles request workflows, while custodians authorize checkouts, oversee active loans, and verify returned equipment.

---

## 2. Actors & Responsibilities
* **Borrower (Student / Department Member):**
  * Authenticates using departmental email credentials.
  * Browses the catalog of departmental equipment and checks availability status.
  * Submits borrow requests for items marked as `AVAILABLE`.
  * Views personal active requests, active loans, and borrowing history.
* **Custodian (Equipment Administrator / Lab Staff):**
  * Authenticates with administrative custodian privileges.
  * Manages asset availability status.
  * Reviews incoming borrow requests and authorizes physical handoffs (checkout).
  * Inspects equipment on return, logs condition notes, and closes loans.

---

## 3. Product Scope & Exclusions
* **In-Scope (Sprints 1–3):**
  * Exclusive individual item tracking by unique asset tags.
  * Role-based access control (Borrower vs. Custodian) at the API and database levels.
  * **Sprint 1:** Asset catalog browsing, borrow request submission, custodian checkout approval, and concurrency conflict rejection (HTTP 409).
  * **Sprint 2:** Equipment return processing, condition notes, loan duration limits, and overdue detection.
  * **Sprint 3:** Category filtering, search, custodian utilization metrics, and containerized deployment hardening.
* **Explicit Exclusions:**
  * Self-registration, public password recovery, and external OAuth2 providers (synthetic seed accounts are used).
  * Financial deposits, rental fees, and monetary penalty calculations.
  * Hardware barcode/RFID scanners and external repair vendor integrations.

---

## 4. Functional Requirements (FR)
* **FR-01 (Authentication & Identity):** The system shall authenticate users via email and password, returning an authenticated session bearing the user's role (`BORROWER` or `CUSTODIAN`).
* **FR-02 (Catalog Browsing):** The system shall allow authenticated Borrowers and Custodians to retrieve the catalog of tracked equipment, showing asset tag, name, category, and availability status.
* **FR-03 (Borrow Request Submission):** The system shall allow an authenticated Borrower to submit a loan request for a designated asset whose current status is `AVAILABLE`.
* **FR-04 (Custodian Checkout Execution):** The system shall allow an authenticated Custodian to approve a pending request, transitioning the asset status to `CHECKED_OUT` and creating an active loan record.
* **FR-05 (Personal Loan Inspection):** The system shall allow an authenticated Borrower to retrieve only their own pending requests and active loan records.
* **FR-06 (All Loans Oversight):** The system shall allow an authenticated Custodian to retrieve all active loans and pending requests across the entire department.

---

## 5. Business Rules (BR)
* **BR-01 (Asset Exclusivity):** Each tracked asset is an exclusive entity identified by a unique asset tag. An asset cannot have more than one active loan or pending request concurrently.
* **BR-02 (Unavailable Asset Guard):** The system shall reject any borrow request or checkout operation targeted at an asset whose status is not `AVAILABLE` with HTTP 409 Conflict.
* **BR-03 (Custodian Authorization Enforcement):** Only users authenticated with the `CUSTODIAN` role may execute checkouts, update item statuses, or view all borrower loan records. Any borrower attempting these actions shall be rejected with HTTP 403 Forbidden.
* **BR-04 (Record Privacy & Ownership):** A Borrower can view only their own borrowing records. Attempting to access another user's loan record shall return HTTP 403 Forbidden.

---

## 6. Non-Functional Requirements (NFR)
* **NFR-01 (Password Security):** All user credentials must be stored using salted cryptographic hashing (bcrypt). Plaintext passwords must never be stored in the database or written to application logs.
* **NFR-02 (Backend Access Protection):** Unauthenticated API requests to protected endpoints must be rejected with HTTP 401 Unauthorized. Requests lacking the required role must be rejected with HTTP 403 Forbidden. Client-side UI controls must not be the sole boundary of authorization.
* **NFR-03 (Data Persistence Integrity):** All asset and loan state transitions must persist to a relational database and survive backend application or container restarts.

---

## 7. Architecture & Design Decisions
1. **Granularity Model:** Individual asset-tag tracking rather than bulk inventory quantities to enforce strict race-condition handling and exclusive checkout.
2. **Session Security:** Token-based session authentication with role validation middleware executed on every protected route.
3. **Deterministic Seeding:** Predefined test credentials (`borrower@ku.ac.th`, `custodian@ku.ac.th`) and equipment records generated via Prisma seed scripts.