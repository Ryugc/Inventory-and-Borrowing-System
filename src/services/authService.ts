import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { Role } from "../types/index.js";
import type { AuthPrincipal, AuthTokenResponse, LoginRequest } from "../types/index.js";

const SESSION_HOURS = 8;

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const authService = {
  async login(input: LoginRequest): Promise<AuthTokenResponse> {
    const email = String(input?.email ?? "").toLowerCase();
    const password = String(input?.password ?? "");
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) throw new HttpError(401, "Invalid credentials");

    const token = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_HOURS * 3600 * 1000) }
    });
    const principal: AuthPrincipal = { id: user.id, email: user.email, role: Role[user.role] };
    return { token, role: principal.role, user: principal };
  },

  async authenticate(token: string): Promise<AuthPrincipal | null> {
    const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) return null;
    return { id: session.user.id, email: session.user.email, role: Role[session.user.role] };
  }
};
