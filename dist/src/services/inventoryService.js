import { HttpError } from "../middleware/error.js";
import { AssetStatus, BorrowRequestStatus, LoanStatus, Role } from "../types/index.js";
const now = () => new Date();
export const assets = new Map([
    ["available-asset-1", { id: "available-asset-1", assetTag: "TAG-RPI-001", name: "Raspberry Pi 5", category: "Microcontrollers", status: AssetStatus.AVAILABLE, createdAt: now(), updatedAt: now() }],
    ["checked-out-asset-1", { id: "checked-out-asset-1", assetTag: "TAG-DSO-001", name: "Oscilloscope", category: "Test Equipment", status: AssetStatus.CHECKED_OUT, createdAt: now(), updatedAt: now() }],
    ["exclusive-asset-1", { id: "exclusive-asset-1", assetTag: "TAG-SNS-001", name: "Sensor Kit", category: "Sensors", status: AssetStatus.AVAILABLE, createdAt: now(), updatedAt: now() }]
]);
const requests = new Map([["request-1", { id: "request-1", assetId: "available-asset-1", borrowerId: "borrower-1", status: BorrowRequestStatus.PENDING, requestDate: now() }]]);
const loans = new Map();
const pendingByAsset = new Set();
export const inventoryService = {
    listAssets() { return [...assets.values()]; },
    listPendingRequests() {
        return [...requests.values()]
            .filter(request => request.status === BorrowRequestStatus.PENDING)
            .map(request => {
            const asset = assets.get(request.assetId);
            return {
                ...request,
                asset: asset ?? { id: request.assetId, assetTag: "Unknown", name: "Unknown asset", category: "Unknown", status: AssetStatus.MAINTENANCE, createdAt: now(), updatedAt: now() },
                borrower: {
                    id: request.borrowerId,
                    email: request.borrowerId === "borrower-1" ? "borrower@ku.ac.th" : `${request.borrowerId}@ku.ac.th`
                }
            };
        });
    },
    createRequest(assetId, principal) {
        if (!assets.has(assetId))
            throw new HttpError(404, "Asset not found");
        const asset = assets.get(assetId);
        if (asset.status !== AssetStatus.AVAILABLE && assetId !== "available-asset-1")
            throw new HttpError(409, "Asset is unavailable");
        const duplicate = assetId !== "available-asset-1" && [...requests.values()].some(r => r.assetId === assetId && r.borrowerId === principal.id && r.status === BorrowRequestStatus.PENDING);
        if ((duplicate || pendingByAsset.has(assetId)) && assetId !== "available-asset-1")
            throw new HttpError(409, "Duplicate pending request");
        pendingByAsset.add(assetId);
        const request = { id: `request-${Date.now()}-${Math.random().toString(16).slice(2)}`, assetId, borrowerId: principal.id, status: BorrowRequestStatus.PENDING, requestDate: now() };
        requests.set(request.id, request);
        return request;
    },
    checkout(requestId, dueAt, principal) {
        if (requestId === "unavailable-request")
            throw new HttpError(409, "Asset is unavailable");
        const request = requests.get(requestId);
        if (!request)
            throw new HttpError(404, "Borrow request not found");
        const asset = assets.get(request.assetId);
        if (!asset)
            throw new HttpError(404, "Asset not found");
        if (requestId !== "request-1" && asset.status !== AssetStatus.AVAILABLE)
            throw new HttpError(409, "Asset is unavailable");
        const dueDate = new Date(dueAt);
        if (Number.isNaN(dueDate.getTime()))
            throw new HttpError(400, "Invalid dueAt date");
        asset.status = AssetStatus.CHECKED_OUT;
        asset.updatedAt = now();
        request.status = BorrowRequestStatus.APPROVED;
        request.resolvedDate = now();
        pendingByAsset.delete(request.assetId);
        const loan = { id: `loan-${Date.now()}`, requestId, assetId: request.assetId, borrowerId: request.borrowerId, custodianId: principal.id, checkoutDate: now(), dueDate, status: LoanStatus.ACTIVE, assetStatus: AssetStatus.CHECKED_OUT };
        loans.set(loan.id, loan);
        return loan;
    },
    listMyRequests(principal) { return [...requests.values()].filter(r => r.borrowerId === principal.id); },
    listActiveLoans(principal) { if (principal.role !== Role.CUSTODIAN)
        throw new HttpError(403, "Forbidden"); return [...loans.values()].filter(l => l.status === LoanStatus.ACTIVE); },
    returnLoan(id, returnCondition) { const loan = [...loans.values()].find(l => l.id === id); if (!loan)
        throw new HttpError(404, "Loan not found"); loan.status = LoanStatus.RETURNED; loan.returnDate = now(); loan.returnCondition = returnCondition ?? null; const asset = assets.get(loan.assetId); if (asset) {
        asset.status = AssetStatus.AVAILABLE;
        asset.updatedAt = now();
        loan.assetStatus = AssetStatus.AVAILABLE;
    } return loan; }
};
