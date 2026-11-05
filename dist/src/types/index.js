export var Role;
(function (Role) {
    Role["BORROWER"] = "BORROWER";
    Role["CUSTODIAN"] = "CUSTODIAN";
})(Role || (Role = {}));
export var AssetStatus;
(function (AssetStatus) {
    AssetStatus["AVAILABLE"] = "AVAILABLE";
    AssetStatus["CHECKED_OUT"] = "CHECKED_OUT";
    AssetStatus["MAINTENANCE"] = "MAINTENANCE";
})(AssetStatus || (AssetStatus = {}));
export var BorrowRequestStatus;
(function (BorrowRequestStatus) {
    BorrowRequestStatus["PENDING"] = "PENDING";
    BorrowRequestStatus["APPROVED"] = "APPROVED";
    BorrowRequestStatus["REJECTED"] = "REJECTED";
    BorrowRequestStatus["CANCELLED"] = "CANCELLED";
})(BorrowRequestStatus || (BorrowRequestStatus = {}));
export var LoanStatus;
(function (LoanStatus) {
    LoanStatus["ACTIVE"] = "ACTIVE";
    LoanStatus["RETURNED"] = "RETURNED";
    LoanStatus["OVERDUE"] = "OVERDUE";
})(LoanStatus || (LoanStatus = {}));
