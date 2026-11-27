# Lab 7 Engineering Contract Revision: CHG-03 (Checkout Due-Date Window)

- **Change ID:** `CHG-03`
- **Issue:** `#49`
- **Contract Version:** `v3.2-lab7` (supersedes `v3.1-lab7`)
- **Target Sprint 1 Feature & Requirements:** `F-05` (Custodian checkout, `FR-04`), `BR-07` (new: loan duration window)
- **Accepted Sprint 1 Baseline:** Tag `v0.1.0` (`c03ff3a`, PR #11)
- **Actual Pre-Change Implementation:** `63f66b9` (main after PR #50)
- **Approval Record:** Team of two on `2026-11-26`. Instructor/TA approval waived per the Lab 7 spec sheet announcement (evidence: E-A1b).

## 0. Sequence Disclosure

The first contract (`v3.1-lab7`, PR #50, `92d90b8`) described a per-borrower quota rule. That rule was never implemented and is withdrawn. The team instead implemented the checkout due-date window (`d687361` red test, `70e1c29` code, merged in PR #51 as `9a4f5bb`). This contract (`v3.2-lab7`) was written and reviewed **after** that code and the boundary tests (`28b8a91`). It documents the change as built and does not claim planning before implementation. PR #53 (22ce351, 5162417) later overwrote this contract with v3.1-lab7 text; the restore PR brings back v3.2-lab7 from 5e5fea8.

## 1. Old vs. New Behavior

| Version | Behavior of `POST /borrow-requests/:id/checkout` `dueAt` |
| :--- | :--- |
| `v0.1.0` (Sprint 1) | `dueAt` required; any parseable date accepted (past or far future). Unparseable: `400 "Invalid dueAt date"`. |
| `63f66b9` (pre-change) | `dueAt` optional (default: checkout + 14 days); must be after checkout, otherwise `400`. No maximum. |
| **New (`BR-07`)** | `dueAt` optional (default unchanged, checkout + 14 days). Must satisfy **1 day <= dueAt - checkoutTime <= 14 days**. Unparseable: `400 "Invalid dueAt date"`. Out of window: `400 "Due date must be between 1 and 14 days after checkout"`. |

Reason: stop custodians from issuing open-ended or same-minute loans for scarce equipment.

## 2. Change Impact Analysis

| Dimension | Artifact / Module | Impact |
| :--- | :--- | :--- |
| Requirement & feature | `FR-04`, `F-05`; related `FR-09`, `F-10`; `BR-07` | Adds min/max duration to checkout due date. |
| Specification docs | `docs/srs.md`, `docs/features.md`, `docs/system-sds.md`, `docs/traceability.md` | Record `BR-07`, `AC-DUE-01`-`04`, `STS-CHECKOUT-006`-`010` at `v3.2-lab7`. |
| API & service | `src/services/inventoryService.ts` (`checkout`) | Duration check moved before the transaction; replaces the old "after checkout" check. |
| UI & callers | `public/app.js` checkout form | No layout change; the existing global error alert shows the server `400` message. |
| Roles & ownership | `src/middleware/auth.ts` | Unchanged: Custodian-only (`403` for Borrower), `401` unauthenticated. |
| Persistence & migrations | `prisma/schema.prisma` | Not applicable: `LoanRecord.dueDate` already stores the value. Existing loans are not revalidated. |
| Preserved behavior | `STS-CHECKOUT-001`-`003`, `STS-OVERDUE-001`-`004`, `STS-RETURN-001`-`004`, `STS-AUTH-005` | Default 14-day due date, overdue detection, 409 on unavailable assets and RBAC stay unchanged. |

## 3. Acceptance Criteria & STS Mapping

| AC ID | STS Test ID | Input | Expected |
| :--- | :--- | :--- | :--- |
| AC-DUE-01 | `STS-CHECKOUT-006`, `STS-CHECKOUT-008` | `dueAt` = now + 30 days; now + 14 days 1 hour | `400` |
| AC-DUE-02 | `STS-CHECKOUT-007` | `dueAt` = now + 12 hours | `400` |
| AC-DUE-03 | `STS-CHECKOUT-009`, `STS-CHECKOUT-010` | `dueAt` = now + 14 days; now + 25 hours | Success (2xx); loan created |
| AC-DUE-04 | `STS-OVERDUE-001`, `STS-OVERDUE-002` (existing) | No `dueAt`; malformed or past `dueAt` | Default 14 days; `400` |

Exact-1-day is not tested because server time runs a few ms after the test's clock, which would make that case flaky. Tested edges: 12 h, 25 h, 14 d, 14 d + 1 h.

## 4. Teammate Review

- Reviewer: Ryugc (teammate), 2026-11-26 19:49 +07:00, PR: #52 (approved on b651579, merged as 5e5fea8 at 19:49:51 +07:00)
- Result: Approved. Contract matches 70e1c29; boundary tests STS-CHECKOUT-007 to 010 reviewed.

## 5. Version Table

| Item | Commit | Time (2026-11-26) |
| :--- | :--- | :--- |
| Sprint 1 baseline | `c03ff3a` (`v0.1.0`) | n/a |
| Pre-change | `63f66b9` | 15:49 |
| Red test (STS-CHECKOUT-006) | `d687361` | 16:35 |
| Implementation | `70e1c29` | 16:38 |
| Merge PR #51 | `9a4f5bb` | 17:08 |
| Boundary tests (007-010) | `28b8a91` | 19:23 (+07:00, 2026-11-26) |
| Merge PR #52 (contract v3.2-lab7 reviewed) | `5e5fea8` | 19:49 (+07:00, 2026-11-26) |
| Overwrite by PR #53 | `22ce351` / `5162417` | 21:36 / 11:00 (+07:00, 2026-11-27) |
| Restore of v3.2-lab7 | restore PR | fill after merge |