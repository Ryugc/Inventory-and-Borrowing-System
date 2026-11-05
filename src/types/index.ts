export enum Role { BORROWER = "BORROWER", CUSTODIAN = "CUSTODIAN" }
export enum AssetStatus { AVAILABLE = "AVAILABLE", CHECKED_OUT = "CHECKED_OUT", MAINTENANCE = "MAINTENANCE" }
export enum BorrowRequestStatus { PENDING = "PENDING", APPROVED = "APPROVED", REJECTED = "REJECTED", CANCELLED = "CANCELLED" }
export enum LoanStatus { ACTIVE = "ACTIVE", RETURNED = "RETURNED", OVERDUE = "OVERDUE" }

export interface AuthPrincipal { id: string; email: string; role: Role }
export interface LoginRequest { email: string; password: string }
export interface AuthTokenResponse { token: string; role: Role; user: AuthPrincipal }
export interface AssetDto { id: string; assetTag: string; name: string; category: string; status: AssetStatus; createdAt: Date; updatedAt: Date }
export interface BorrowRequestDto { id: string; assetId: string; borrowerId: string; status: BorrowRequestStatus; requestDate: Date; resolvedDate?: Date | null }
export interface LoanDto { id: string; requestId: string; assetId: string; borrowerId: string; custodianId: string; checkoutDate: Date; dueDate: Date; returnDate?: Date | null; returnCondition?: string | null; status: LoanStatus; assetStatus: AssetStatus }
