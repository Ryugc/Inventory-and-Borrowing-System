import bcrypt from "bcrypt";
import { HttpError } from "../middleware/error.js";
import { Role } from "../types/index.js";
import type { AuthPrincipal, AuthTokenResponse, LoginRequest } from "../types/index.js";

const accounts = new Map<string, { principal: AuthPrincipal; password: string }>([
  ["borrower@ku.ac.th", { principal: { id: "borrower-1", email: "borrower@ku.ac.th", role: Role.BORROWER }, password: "borrower-password" }],
  ["custodian@ku.ac.th", { principal: { id: "custodian-1", email: "custodian@ku.ac.th", role: Role.CUSTODIAN }, password: "custodian-password" }]
]);

export const authService = {
  async login(input: LoginRequest): Promise<AuthTokenResponse> {
    const account = accounts.get(input.email.toLowerCase());
    if (!account || input.password !== account.password) throw new HttpError(401, "Invalid credentials");
    await bcrypt.hash(input.password, 10);
    const role = account.principal.role;
    return { token: role === Role.CUSTODIAN ? "custodian-token" : "borrower-token", role, user: account.principal };
  }
};
