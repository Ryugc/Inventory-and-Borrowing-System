# Sprint 3 Engineering Contracts

**Version:** v3.0-draft  
**Status:** Draft  
**Scope:** C-09 through C-12 (F-12, F-13, F-14, and deferred F-15)

This document defines the Sprint 3 UI, API, data, permissions, acceptance, and system-test contracts. C-09 is the current implementation scope; C-10 through C-12 remain planned.

## C-09 — F-12 Search and Category Filtering (FR-11)

### UI contract

- Place search, category, and status controls, plus a Clear button, above `#catalogGrid` in `public/index.html`.
- Search accepts free text for asset name or asset tag. Category accepts free text. Status offers All statuses and the three supported asset statuses.
- Applying a filter refreshes `#catalogGrid` using the active filters. Clear resets all filters and reloads the unfiltered catalog.
- Preserve existing catalog and checkout element IDs, including `catalogGrid`, `assetForm`, `checkoutForm`, `requestId`, and `dueAt`.

### API contract

`GET /api/assets`

Requires authentication; both Borrower and Custodian may list assets. All query parameters are optional:

| Parameter | Meaning |
|---|---|
| `q` | Case-insensitive substring match against `name` OR `assetTag`. |
| `category` | Exact category match, case-insensitive. |
| `status` | Exact status: `AVAILABLE`, `CHECKED_OUT`, or `MAINTENANCE`. An unsupported or non-scalar supplied value returns `400 Bad Request`. |

When multiple valid filters are supplied, they are combined with AND; the two `q` fields are combined with OR. Empty `q` and `category` are treated as no filter. Return `200 OK` with the existing ordered asset array and existing asset fields. Invalid status uses the standard `400` response format already used by the API.

### Data and permission contract

- Filter the existing `Asset` records; do not change asset persistence or status transitions.
- Search uses a case-insensitive substring operation; category uses case-insensitive exact equality; status uses the existing `AssetStatus` enum.
- Authentication is required. There is no role difference between authenticated Borrowers and Custodians for catalog reads.

### Acceptance criteria and tests

| AC | Acceptance criterion | STS |
|---|---|---|
| AC-SRCH-01 | `GET /api/assets?q=...` finds matching names or tags without case sensitivity. | STS-SEARCH-001 |
| AC-SRCH-02 | Category and status filters return only records matching both filters. | STS-SEARCH-002 |
| AC-SRCH-03 | `q`, category, and status combine as an intersection; invalid status returns `400 Bad Request`. | STS-SEARCH-003 |
| AC-SRCH-04 | Filter controls render above `#catalogGrid`, update its results, and preserve existing catalog/checkout IDs. | STS-SEARCH-004 |

## C-10 — F-13 Inventory Utilization Report (FR-12)

### UI contract

- Add a utilization report panel to the Custodian view. It presents total assets, counts for each asset status, category counts, active loans, and overdue loans.
- Do not show the panel to Borrowers. Load or refresh report data when the Custodian opens the panel/view; present API failures through the existing error UI.

### API contract

`GET /api/reports/utilization`

- Requires authentication and the `CUSTODIAN` role. Borrowers receive `403 Forbidden`; unauthenticated callers receive `401 Unauthorized`.
- Returns `200 OK` in this shape:

```json
{
  "totalAssets": 0,
  "assetsByStatus": {
    "AVAILABLE": 0,
    "CHECKED_OUT": 0,
    "MAINTENANCE": 0
  },
  "assetsByCategory": [{ "category": "Example", "count": 0 }],
  "activeLoans": 0,
  "overdueLoans": 0
}
```

### Data and permission contract

- Derive asset totals and category counts from persisted `Asset` records.
- `activeLoans` counts loans with no return date and a status of `ACTIVE` or `OVERDUE`.
- `overdueLoans` counts unreturned loans whose due date is before the report time, including records whose persisted status has not yet been updated to `OVERDUE`.
- Only a Custodian may retrieve aggregate utilization data.

### Acceptance criteria and tests

| AC | Acceptance criterion | STS |
|---|---|---|
| AC-UTIL-01 | Custodian receives accurate total assets, all three status counts, and category breakdowns. | STS-UTIL-001 |
| AC-UTIL-02 | Active and overdue loan totals use the defined unreturned-loan rules. | STS-UTIL-002 |
| AC-UTIL-03 | Borrower is denied access and Custodian report panel is role-gated. | STS-UTIL-003 |

## C-11 — F-14 Deployment Hardening and Regression Suite (NFR-04)

### UI contract

- API failures remain JSON responses; do not expose stack traces, SQL, credentials, or environment values to clients.
- Existing UI error handling continues to display the response message for failed requests.

### API contract

- Malformed JSON returns `400 Bad Request`; an unmatched route returns `404 Not Found`; unexpected server failures return `500 Internal Server Error`.
- These errors use one JSON envelope: `{"error":{"status":<HTTP status>,"code":"<stable code>","message":"<safe message>"}}`.
- Expected validation and authorization errors retain their appropriate HTTP statuses and use the same envelope shape.

### Data, environment, and permission contract

- Validate required runtime configuration at startup, including database connectivity configuration and authentication secret configuration; fail fast with a safe diagnostic if invalid, without logging secret values.
- Do not alter persisted domain data or loosen any role/ownership checks as part of hardening.
- Regression tests run through `npm test`; CI and Docker verification must include the same automated regression suite and a successful production build.

### Acceptance criteria and tests

| AC | Acceptance criterion | STS |
|---|---|---|
| AC-HARD-01 | Malformed JSON, unmatched routes, and unexpected errors return the specified status and common JSON envelope. | STS-HARD-001 |
| AC-HARD-02 | Missing or invalid required startup configuration prevents the server from starting and does not disclose secrets. | STS-HARD-002 |
| AC-HARD-03 | The automated regression suite and production build pass in the local, Docker, and CI verification paths. | STS-HARD-003 |

## C-12 — F-15 Request Rejection and Cancellation (FR-13, FR-14; deferred via CHG-01)

### UI contract

- In the Custodian pending-request view, provide a Reject action alongside the existing approval/checkout flow.
- In the Borrower's own request view, provide a Cancel action only while the request is pending.
- On success, refresh the affected request list. Report conflicts and permission failures through the existing error UI.

### API contract

| Operation | Authorization | Success | Required failures |
|---|---|---|---|
| `POST /api/borrow-requests/:id/reject` | Authenticated Custodian only. | `200 OK`, updated request with status `REJECTED`. | `401` unauthenticated, `403` Borrower, `404` unknown request, `409` request not `PENDING`. |
| `POST /api/borrow-requests/:id/cancel` | Authenticated Borrower who owns the request. | `200 OK`, updated request with status `CANCELLED`. | `401` unauthenticated, `403` non-owner or Custodian, `404` unknown request, `409` request not `PENDING`. |

Both operations accept no request body. They set the resolution timestamp and must not create or alter a loan.

### Data and permission contract

- Only a `PENDING` `BorrowRequest` may transition to `REJECTED` or `CANCELLED`.
- Perform each state check and update atomically so concurrent resolution cannot overwrite a completed transition.
- Enforce role and ownership server-side; hiding a UI action is not authorization.

### Acceptance criteria and tests

| AC | Acceptance criterion | STS |
|---|---|---|
| AC-REQ-01 | Custodian rejection changes a pending request to `REJECTED`; unauthorized and missing requests fail with the specified status. | STS-REQ-001 |
| AC-REQ-02 | The owning Borrower can cancel a pending request and receives `CANCELLED`. | STS-REQ-002 |
| AC-REQ-03 | A non-owner is forbidden; cancellation or rejection of a non-pending request returns `409` without changing the existing state. | STS-REQ-003 |
| AC-REQ-04 | Reject and Cancel actions are shown only to the appropriate role and only for pending requests. | STS-REQ-004 |
