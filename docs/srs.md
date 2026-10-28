# Software Requirements Specification (SRS)
## Theme 2: Inventory and Borrowing System
**Course:** CPE 334 Software Engineering in the Age of AI Agents  
**Semester:** 1/2026  
**Team Repository:** https://github.com/Ryugc/Inventory-and-Borrowing-System  

---

## 1. Problem Statement & System Context
Academic and laboratory departments lend physical equipment (microcontrollers, sensors, oscilloscopes, laptops, and cameras) to students and faculty members. Traditional paper logs and spreadsheets create misplaced inventory, double-booking of exclusive hardware, and a lack of accountability for equipment condition.

The Inventory and Borrowing System provides a centralized web platform where borrowers can browse real-time departmental asset availability and submit borrow requests, while equipment custodians control physical checkouts, manage loan lifecycles, and inspect equipment returns.

---

## 2. Actors & Responsibilities
* **Borrower (Student / Department Member):**
  * Authenticates using departmental account credentials.
  * Browses the catalog of departmental equipment and inspects availability status.
  * Submits borrow requests for currently available assets.
  * Views personal active requests, active loans, and borrowing history.
* **Custodian (Equipment Administrator / Lab Staff):**
  * Authenticates with administrative privileges.
  * Manages the asset catalog (creates assets, updates availability status).
  * Inspects incoming borrower requests and authorizes physical checkouts.
  * Processes equipment returns and records return condition.

---

## 3. Product Scope & Exclusions
* **In-Scope (Sprints 1–3):**
  * Individual item tracking by unique asset tag (exclusive item model).
  * Role-based access control and backend authorization (Borrower vs. Custodian).
  * Sprint 1: Catalog viewing, borrow request submission, custodian checkout transition, and conflict rejection.
  * Sprint 2: Asset return processing, condition notes, due date calculation, and overdue status detection.
  * Sprint 3: Category filtering, search, inventory utilization reporting, and deployment hardening.
* **Explicit Exclusions:**
  * Self-registration, public password recovery, and external OAuth providers are excluded (seeded demo accounts are used).
  * Financial deposits, rental fees, and monetary compensation are out of scope.
  * External repair vendor integrations and physical barcode/RFID scanners are excluded.

---

## 4. Functional Requirements (FR)
* **FR-01 (Authentication & Identity):** The system shall authenticate users with an email and password, establishing an authenticated session with an assigned role (`BORROWER` or `CUSTODIAN`).
* **FR-02 (Catalog Inspection):** The system shall allow authenticated Borrowers and Custodians to view the catalog of tracked equipment assets, including asset tag, item name, category, and current availability status.
* **FR-03 (Borrow Request Submission):** The system shall allow an authenticated Borrower to submit a borrow request for a specific asset that is currently marked as `AVAILABLE`.
* **FR-04 (Custodian Checkout Execution):** The system shall allow an authenticated Custodian to approve a pending request and record an active checkout, creating an active loan record and transitioning asset status to `CHECKED_OUT`.
* **FR-05 (Personal Loan Inspection):** The system shall allow an authenticated Borrower to retrieve their own active requests and active loan records.
* **FR-06 (All Loans Management):** The system shall allow an authenticated Custodian to retrieve all active loans and pending requests across all borrowers.

---

## 5. Business Rules (BR)
* **BR-01 (Asset Exclusivity):** Each tracked asset is an exclusive entity with a unique asset tag. An asset cannot have more than one active loan or pending request concurrently.
* **BR-02 (Unavailable Asset Guard):** The system shall reject any borrow request or checkout operation targeted at an asset whose status is not `AVAILABLE` with HTTP 409 Conflict.
* **BR-03 (Role Authorization Enforcement):** Only users authenticated with the `CUSTODIAN` role may perform checkouts, modify asset availability, or view all borrower loan records. Any borrower attempting these operations shall be rejected with HTTP 403 Forbidden.
* **BR-04 (Record Privacy & Ownership):** A Borrower can only view and query their own requests and loan records. Any attempt to query another user's loan data by ID shall be rejected with HTTP 403 Forbidden.

---

## 6. Non-Functional Requirements (NFR)
* **NFR-01 (Password Security):** All user credentials must be stored securely using salted cryptographic hashing (bcrypt or Argon2). Plaintext passwords must never be stored in the database or logged in application logs.
  * *Verification:* Database query inspection on seeded users and unit tests on the user creation model.
* **NFR-02 (Backend Access Protection):** Unauthenticated API requests to protected endpoints must be rejected with HTTP 401 Unauthorized. Requests lacking required role permissions must be rejected with HTTP 403 Forbidden. Client-side UI controls must not be the sole boundary of authorization.
  * *Verification:* Automated API integration tests targeting protected routes without headers or with an unauthorized token.
* **NFR-03 (Data Persistence Integrity):** All asset and loan state transitions must persist to a relational database and survive an application or container restart.
  * *Verification:* Integration test executing a state change, restarting the application process, and retrieving the persisted record.

---

## 7. Assumptions & Design Decisions
1. **Decision (Tracking Granularity):** Assets are tracked individually by unique asset tags rather than bulk quantities to enforce deterministic race-condition handling and exclusive item checkout.
2. **Decision (Authentication Strategy):** Session tokens containing user ID and role will be issued upon login and validated via server-side middleware on every protected API route.
3. **Decision (Seeded Test Accounts):** Sprint 1 uses synthetic seed scripts to provide deterministic test accounts (`borrower@ku.ac.th`, `custodian@ku.ac.th`) and an initial catalog of equipment items.