# Sprint 1 Feature Specification: Feature 02 (F-02)
## Custodian Checkout Authorization & Loan Management

- **Module:** Loan Checkout Service
- **Actor:** Custodian (Exclusive Authorization)
- **Traceability:** Maps to FR-04, FR-06, BR-03, NFR-02

---

## 1. Endpoint Contracts

### 1.1 Authorize Checkout (Handoff)
Approves a pending request, transitioning the asset status to `CHECKED_OUT` and opening an active loan record.

- **Method / Path:** `POST /api/loans/checkout`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <custodian_token>`
- **Request Body:**
```json
{
  "requestId": "req-9901-abcd",
  "dueDate": "2026-11-14T23:59:59.000Z"
}
```
- **Response `201 Created`:**
```json
{
  "id": "loan-5501-wxyz",
  "assetId": "clx1a000108l4123456789abc",
  "borrowerId": "usr-student-001",
  "custodianId": "usr-admin-custodian",
  "checkoutDate": "2026-10-30T03:30:00.000Z",
  "dueDate": "2026-11-14T23:59:59.000Z",
  "status": "ACTIVE"
}
```
- **Response `403 Forbidden` (BR-03 RBAC Violation):**
```json
{
  "error": "Forbidden",
  "message": "Only custodians are authorized to approve checkouts."
}
```
- **Response `409 Conflict`:**
```json
{
  "error": "Conflict",
  "message": "Target request is not in PENDING status or asset already checked out."
}
```

---

### 1.2 View All Departmental Loans
Retrieves all active loans across all borrowers for departmental oversight.

- **Method / Path:** `GET /api/loans/active`
- **Headers:** 
  - `Authorization: Bearer <custodian_token>`
- **Response `200 OK`:**
```json
[
  {
    "id": "loan-5501-wxyz",
    "assetTag": "TAG-RPI-001",
    "borrowerEmail": "borrower@ku.ac.th",
    "checkoutDate": "2026-10-30T03:30:00.000Z",
    "dueDate": "2026-11-14T23:59:59.000Z",
    "status": "ACTIVE"
  }
]
```
- **Response `403 Forbidden`:**
```json
{
  "error": "Forbidden",
  "message": "Access denied. Custodian role required."
}
```

---

## 2. Test Verification Matrix (Acceptance Criteria)

| Test ID | Scenario | Expected Status |
| :--- | :--- | :---: |
| `STS-CHECKOUT-001` | Custodian approves pending checkout | `201 Created` |
| `STS-CHECKOUT-002` | Borrower attempts to execute checkout | `403 Forbidden` |
| `STS-CHECKOUT-003` | Custodian attempts checkout on already active loan | `409 Conflict` |
| `STS-LOANS-001` | Custodian lists all active departmental loans | `200 OK` |
| `STS-LOANS-002` | Borrower attempts to query all departmental loans | `403 Forbidden` |